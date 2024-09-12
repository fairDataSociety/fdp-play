import { BeeDebug } from '@ethersphere/bee-js'
import Dockerode, { Container, ContainerCreateOptions } from 'dockerode'
import { Logging } from '../command/root-command/logging'
import { DEFAULT_FAIROS_IMAGE } from '../constants'
import { ContainerImageConflictError } from './error'

export const DEFAULT_ENV_PREFIX = 'fdp-play'
export const DEFAULT_BEE_IMAGE_PREFIX = 'fdp-play'

const BLOCKCHAIN_IMAGE_NAME = 'fairdatasociety/fdp-play-blockchain'
const QUEEN_IMAGE_NAME_SUFFIX = '-queen'
const WORKER_IMAGE_NAME_SUFFIX = '-worker'
const NETWORK_NAME_SUFFIX = '-network'
const BLOCKCHAIN_IMAGE_NAME_SUFFIX = '-blockchain'
const FAIROS_NAME_SUFFIX = '-fairos'

export const WORKER_COUNT = 4
export const BLOCKCHAIN_VERSION_LABEL_KEY = 'org.ethswarm.beefactory.blockchain-version'

// TODO: This should be possible to override with for example ENV variable in case somebody is rocking custom images
const SWAP_PRICE_ORACLE_ADDRESS = '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24'
const SWAP_FACTORY_ADDRESS = '0xCfEB869F69431e42cdB54A4F4f105C19C080A601'
const POSTAGE_STAMP_ADDRESS = '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B'
// const POSTAGE_PRICE_ORACLE_ADDRESS = '0xC89Ce4735882C9F0f0FE26686c53074E09B0D550'
const STAKE_REGISTRY_ADDRESS = '0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb'
const REDISTRIBUTION_ADDRESS = '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7'

export interface RunOptions {
  fresh: boolean
  pullImage?: boolean
}

export enum ContainerType {
  QUEEN = 'queen',
  BLOCKCHAIN = 'blockchain',
  WORKER_1 = 'worker1',
  WORKER_2 = 'worker2',
  WORKER_3 = 'worker3',
  WORKER_4 = 'worker4',
  FAIROS = 'fairos',
}

export type Status = 'running' | 'exists' | 'not-found'
type FindResult = { container?: Container; image?: string }

export interface AllStatus {
  blockchain: Status
  queen: Status
  worker1: Status
  worker2: Status
  worker3: Status
  worker4: Status
}

export interface DockerError extends Error {
  reason: string
  statusCode: number
}

export interface IDocker {
  console: Logging
  envPrefix: string
  beeImagePrefix: string
  beeRepo?: string
  blockchainImageName?: string
  fairOsImage?: string
  fairOsPostageBatchId?: string
}

export class Docker {
  private docker: Dockerode
  private console: Logging
  private runningContainers: Container[]
  private envPrefix: string
  private beeImagePrefix: string
  private blockchainImageName: string
  private beeRepo?: string
  private fairOsImage: string
  private fairOsPostageBatchId?: string

  private get networkName() {
    return `${this.envPrefix}${NETWORK_NAME_SUFFIX}`
  }

  private get blockchainName() {
    return `${this.envPrefix}${BLOCKCHAIN_IMAGE_NAME_SUFFIX}`
  }

  private get queenName() {
    return `${this.envPrefix}${QUEEN_IMAGE_NAME_SUFFIX}`
  }

  private get fairOsName() {
    return `${this.envPrefix}${FAIROS_NAME_SUFFIX}`
  }

  private queenImage(beeVersion: string) {
    if (!this.beeRepo) throw new TypeError('Repo has to be defined!')

    return `${this.beeRepo}/${this.beeImagePrefix}${QUEEN_IMAGE_NAME_SUFFIX}:${beeVersion}`
  }

  private workerName(index: number) {
    return `${this.envPrefix}${WORKER_IMAGE_NAME_SUFFIX}-${index}`
  }

  private workerImage(beeVersion: string, workerNumber: number) {
    if (!this.beeRepo) throw new TypeError('Repo has to be defined!')

    return `${this.beeRepo}/${this.beeImagePrefix}${WORKER_IMAGE_NAME_SUFFIX}-${workerNumber}:${beeVersion}`
  }

  constructor({
    console,
    envPrefix,
    beeImagePrefix,
    blockchainImageName,
    beeRepo,
    fairOsImage,
    fairOsPostageBatchId,
  }: IDocker) {
    this.docker = new Dockerode()
    this.console = console
    this.runningContainers = []
    this.envPrefix = envPrefix
    this.beeImagePrefix = beeImagePrefix
    this.blockchainImageName = blockchainImageName || BLOCKCHAIN_IMAGE_NAME
    this.beeRepo = beeRepo
    this.fairOsImage = fairOsImage || DEFAULT_FAIROS_IMAGE
    this.fairOsPostageBatchId = fairOsPostageBatchId
  }

  public async createNetwork(): Promise<void> {
    const networks = await this.docker.listNetworks({ filters: { name: [this.networkName] } })

    if (networks.length === 0) {
      await this.docker.createNetwork({ Name: this.networkName })
    }
  }

  public async startBlockchainNode(options: RunOptions): Promise<void> {
    if (options.fresh) await this.removeContainer(this.blockchainName)

    // must be the same as in orchestrator/builder/blockchain/start.sh
    const cmdArgs = [
      '--allow-insecure-unlock',
      '--unlock=0xCEeE442a149784faa65C35e328CCd64d874F9a02',
      '--password=/root/password',
      '--mine',
      '--miner.etherbase=0xCEeE442a149784faa65C35e328CCd64d874F9a02',
      '--http',
      '--http.api="debug,web3,eth,txpool,net,personal"',
      '--http.corsdomain=*',
      '--http.port=9545',
      '--http.addr=0.0.0.0',
      '--http.vhosts=*',
      '--ws',
      '--ws.api="debug,web3,eth,txpool,net,personal"',
      '--ws.port=9546',
      '--ws.origins=*',
      '--maxpeers=0',
      '--networkid=4020',
      '--authrpc.vhosts=*',
      '--authrpc.addr=0.0.0.0',
    ]

    const container = await this.findOrCreateContainer(
      this.blockchainName,
      {
        Image: this.blockchainImageName,
        name: this.blockchainName,
        ExposedPorts: {
          '9545/tcp': {},
          '9546/tcp': {},
        },
        Cmd: cmdArgs,
        AttachStderr: false,
        AttachStdout: false,
        HostConfig: {
          PortBindings: { '9545/tcp': [{ HostPort: '9545' }], '9546/tcp': [{ HostPort: '9546' }] },
          NetworkMode: this.networkName,
        },
      },
      options.pullImage,
    )

    this.runningContainers.push(container)
    const state = await container.inspect()

    // If it is already running (because of whatever reason) we are not spawning new node
    if (!state.State.Running) {
      await container.start()
    } else {
      this.console.info('The blockchain container was already running, so not starting it again.')
    }
  }

  public async startFairOs(options: RunOptions): Promise<void> {
    if (options.fresh) await this.removeContainer(this.fairOsName)

    const fairOsCmdParams = await this.createFairOsCmdParams()
    const container = await this.findOrCreateContainer(
      this.fairOsName,
      {
        Image: this.fairOsImage,
        name: this.fairOsName,
        Cmd: ['server', ...fairOsCmdParams],
        ExposedPorts: {
          '9090/tcp': {},
        },
        AttachStderr: false,
        AttachStdout: false,
        HostConfig: {
          PortBindings: { '9090/tcp': [{ HostPort: '9090' }] },
          NetworkMode: this.networkName,
        },
      },
      options.pullImage,
    )

    this.runningContainers.push(container)
    const state = await container.inspect()

    // If it is already running (because of whatever reason) we are not spawning new node
    if (!state.State.Running) {
      await container.start()
    } else {
      this.console.info('The FairOS container was already running, so not starting it again.')
    }
  }

  public async startQueenNode(beeVersion: string, options: RunOptions): Promise<void> {
    if (options.fresh) await this.removeContainer(this.queenName)

    const container = await this.findOrCreateContainer(
      this.queenName,
      {
        Image: this.queenImage(beeVersion),
        name: this.queenName,
        ExposedPorts: {
          '1633/tcp': {},
          '1634/tcp': {},
        },
        Tty: true,
        Cmd: ['start'],
        Env: this.createBeeEnvParameters(),
        AttachStderr: false,
        AttachStdout: false,
        HostConfig: {
          NetworkMode: this.networkName,
          PortBindings: {
            '1633/tcp': [{ HostPort: '1633' }],
            '1634/tcp': [{ HostPort: '1634' }],
          },
        },
      },
      options.pullImage,
    )

    this.runningContainers.push(container)
    const state = await container.inspect()

    // If it is already running (because of whatever reason) we are not spawning new node.
    // Already in `findOrCreateContainer` the container is verified that it was spawned with expected version.
    if (!state.State.Running) {
      await container.start()
    } else {
      this.console.info('The Queen node container was already running, so not starting it again.')
    }
  }

  public async startWorkerNode(
    beeVersion: string,
    workerNumber: number,
    queenAddress: string,
    options: RunOptions,
  ): Promise<void> {
    if (options.fresh) await this.removeContainer(this.workerName(workerNumber))

    const container = await this.findOrCreateContainer(
      this.workerName(workerNumber),
      {
        Image: this.workerImage(beeVersion, workerNumber),
        name: this.workerName(workerNumber),
        ExposedPorts: {
          '1633/tcp': {},
          '1634/tcp': {},
        },
        Cmd: ['start'],
        Env: this.createBeeEnvParameters(queenAddress),
        AttachStderr: false,
        AttachStdout: false,
        HostConfig: {
          NetworkMode: this.networkName,
          PortBindings: {
            '1633/tcp': [{ HostPort: (1633 + workerNumber * 10000).toString() }],
            '1634/tcp': [{ HostPort: (1634 + workerNumber * 10000).toString() }],
          },
        },
      },
      options.pullImage,
    )

    this.runningContainers.push(container)
    const state = await container.inspect()

    // If it is already running (because of whatever reason) we are not spawning new node
    if (!state.State.Running) {
      await container.start()
    } else {
      this.console.info('The Queen node container was already running, so not starting it again.')
    }
  }

  public async logs(
    target: ContainerType,
    outputStream: NodeJS.WriteStream,
    follow = false,
    tail?: number,
  ): Promise<void> {
    const { container } = await this.findContainer(this.getContainerName(target))

    if (!container) {
      throw new Error('Queen container does not exists, even though it should have had!')
    }

    // FIXME: create GitHub issue in dockerode about it
    // prettier-ignore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs = await container.logs({ stdout: true, stderr: true, follow, tail } as any)

    if (!follow) {
      outputStream.write(logs as unknown as Buffer)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(logs as any).pipe(outputStream)
    }
  }

  public async stopAll(allWithPrefix = false, deleteContainers = false): Promise<void> {
    const containerProcessor = async (container: Container) => {
      try {
        await container.stop()
      } catch (e) {
        // We ignore 304 that represents that the container is already stopped
        if ((e as DockerError).statusCode !== 304) {
          throw e
        }
      }

      if (deleteContainers) {
        await container.remove()
      }
    }

    this.console.info('Stopping all containers')
    await Promise.all(this.runningContainers.map(containerProcessor))

    if (allWithPrefix) {
      const containers = await this.docker.listContainers({ all: true })
      await Promise.all(
        containers
          .filter(container => container.Names.filter(n => n.startsWith('/' + this.envPrefix)).length >= 1)
          .map(container => this.docker.getContainer(container.Id))
          .map(containerProcessor),
      )
    }
  }

  public async getBlockchainVersionFromQueenMetadata(beeVersion: string): Promise<string> {
    // Lets pull the Queen's image if it is not present
    const pullStream = await this.docker.pull(this.queenImage(beeVersion))
    await new Promise(res => this.docker.modem.followProgress(pullStream, res))

    const queenMetadata = await this.docker.getImage(this.queenImage(beeVersion)).inspect()

    const version = queenMetadata.Config.Labels[BLOCKCHAIN_VERSION_LABEL_KEY]

    if (!version) {
      throw new Error('Blockchain image version was not found in Queen image labels!')
    }

    return version
  }

  public async getAllStatus(): Promise<AllStatus> {
    return {
      queen: await this.getStatusForContainer(ContainerType.QUEEN),
      blockchain: await this.getStatusForContainer(ContainerType.BLOCKCHAIN),
      worker1: await this.getStatusForContainer(ContainerType.WORKER_1),
      worker2: await this.getStatusForContainer(ContainerType.WORKER_2),
      worker3: await this.getStatusForContainer(ContainerType.WORKER_3),
      worker4: await this.getStatusForContainer(ContainerType.WORKER_4),
    }
  }

  private async removeContainer(name: string): Promise<void> {
    this.console.info(`Removing container with name "${name}"`)
    const { container } = await this.findContainer(name)

    // Container does not exist so nothing to delete
    if (!container) {
      return
    }

    await container.remove({ v: true, force: true })
  }

  private async findOrCreateContainer(
    name: string,
    createOptions: ContainerCreateOptions,
    pullImage = false,
  ): Promise<Container> {
    const { container, image: foundImage } = await this.findContainer(name)

    if (container) {
      this.console.info(`Container with name "${name}" found. Using it.`)

      if (foundImage !== createOptions.Image) {
        throw new ContainerImageConflictError(
          `Container with name "${name}" found but it was created with different image or image version then expected!`,
          foundImage!,
          createOptions.Image!,
        )
      }

      return container
    }

    this.console.info(`Container with name "${name}" not found. Creating new one.`)

    try {
      // if the image label is 'latest' then it tries to pull the new version of it
      if (createOptions.Image && pullImage) {
        await this.docker.getImage(createOptions.Image).remove()
      }

      return await this.docker.createContainer(createOptions)
    } catch (e) {
      // 404 is Image Not Found ==> pull the image
      if ((e as DockerError).statusCode !== 404) {
        throw e
      }

      this.console.info(`Image ${createOptions.Image} not found. Pulling it.`)
      const pullStream = await this.docker.pull(createOptions.Image!)
      await new Promise(res => this.docker.modem.followProgress(pullStream, res))

      return await this.docker.createContainer(createOptions)
    }
  }

  private async findContainer(name: string): Promise<FindResult> {
    const containers = await this.docker.listContainers({ all: true, filters: { name: [name] } })

    if (containers.length === 0) {
      return {}
    }

    if (containers.length > 1) {
      throw new Error(`Found ${containers.length} containers for name "${name}". Expected only one.`)
    }

    return { container: this.docker.getContainer(containers[0].Id), image: containers[0].Image }
  }

  public async getStatusForContainer(name: ContainerType): Promise<Status> {
    const foundContainer = await this.findContainer(this.getContainerName(name))

    if (!foundContainer.container) {
      return 'not-found'
    }

    const inspectStatus = await foundContainer.container.inspect()

    if (inspectStatus.State.Running) {
      return 'running'
    }

    return 'exists'
  }

  private getContainerName(name: ContainerType) {
    switch (name) {
      case ContainerType.BLOCKCHAIN:
        return this.blockchainName
      case ContainerType.QUEEN:
        return this.queenName
      case ContainerType.WORKER_1:
        return this.workerName(1)
      case ContainerType.WORKER_2:
        return this.workerName(2)
      case ContainerType.WORKER_3:
        return this.workerName(3)
      case ContainerType.WORKER_4:
        return this.workerName(4)
      case ContainerType.FAIROS:
        return this.fairOsName
      default:
        throw new Error('Unknown container!')
    }
  }

  private createBeeEnvParameters(bootnode?: string): string[] {
    const options: Record<string, string> = {
      'warmup-time': '0',
      'debug-api-enable': 'true',
      verbosity: '4',
      'swap-enable': 'true',
      mainnet: 'false',
      'swap-endpoint': `http://${this.blockchainName}:9545`,
      'swap-factory-address': SWAP_FACTORY_ADDRESS,
      password: 'password',
      'postage-stamp-address': POSTAGE_STAMP_ADDRESS,
      'price-oracle-address': SWAP_PRICE_ORACLE_ADDRESS,
      'redistribution-address': REDISTRIBUTION_ADDRESS,
      'staking-address': STAKE_REGISTRY_ADDRESS,
      'postage-stamp-start-block': '1',
      'network-id': '4020',
      'full-node': 'true',
      'welcome-message': 'You have found the queen of the beehive...',
      'api-addr': '0.0.0.0:1633',
      'cors-allowed-origins': '*',
    }

    if (bootnode) {
      options.bootnode = bootnode
    } else {
      options['bootnode-mode'] = 'true'
    }

    // Env variables for Bee has form of `BEE_WARMUP_TIME`, so we need to transform it.
    return Object.entries(options).reduce<string[]>((previous, current) => {
      const keyName = `BEE_${current[0].toUpperCase().replace(/-/g, '_')}`
      previous.push(`${keyName}=${current[1]}`)

      return previous
    }, [])
  }

  private async createFairOsCmdParams(): Promise<string[]> {
    const batchId = this.fairOsPostageBatchId || (await this.createPostageBatch())
    const corsOrigins = '*'
    const cookieDomain = 'localhost'
    const beeApiUrl = `http://${this.queenName}:1633`

    return [
      `--postageBlockId=${batchId}`,
      `--cors-origins=${corsOrigins}`,
      `--beeApi=${beeApiUrl}`,
      `--ens-network=play`,
      `--rpc=http://${this.blockchainName}:9545`,
      `--cookieDomain=${cookieDomain}`,
    ]
  }

  private async createPostageBatch(): Promise<string> {
    const beeDebug = new BeeDebug('http://localhost:1633')

    return beeDebug.createPostageBatch('10000000000', 21)
  }
}
