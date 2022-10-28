import { LeafCommand, Option } from 'furious-commander'
import { RootCommand } from './root-command'
import {
  ContainerType,
  DEFAULT_ENV_PREFIX,
  DEFAULT_BEE_IMAGE_PREFIX,
  Docker,
  RunOptions,
  WORKER_COUNT,
} from '../utils/docker'
import { waitForBlockchain, waitForQueen, waitForWorkers } from '../utils/wait'
import ora from 'ora'
import { VerbosityLevel } from './root-command/logging'
import { stripCommit } from '../utils/config-sources'
import { DEFAULT_BLOCKCHAIN_IMAGE, DEFAULT_FAIROS_IMAGE, ENV_ENV_PREFIX_KEY } from '../constants'

const DEFAULT_BEE_REPO = 'fairdatasociety'
const ENV_IMAGE_PREFIX_KEY = 'FDP_PLAY_IMAGE_PREFIX'
const ENV_REPO_KEY = 'FDP_PLAY_DOCKER_REPO'
const ENV_DETACH_KEY = 'FDP_PLAY_DETACH'
const ENV_WORKERS_KEY = 'FDP_PLAY_WORKERS'
const ENV_FRESH_KEY = 'FDP_PLAY_FRESH'

export class Start extends RootCommand implements LeafCommand {
  public readonly name = 'start'

  public readonly description = 'Spin up the FDP Play cluster. Before this, please make sure Docker Service is running!'

  @Option({
    key: 'fresh',
    alias: 'f',
    type: 'boolean',
    description: 'The cluster data will be purged before start',
    envKey: ENV_FRESH_KEY,
    default: false,
  })
  public fresh!: boolean

  @Option({
    key: 'pull',
    type: 'boolean',
    description: 'The Docker images will be pulled from the Docker repository',
    default: false,
  })
  public pullImage!: boolean

  @Option({
    key: 'detach',
    alias: 'd',
    type: 'boolean',
    description: 'Spin up the cluster and exit. No logging is outputted.',
    envKey: ENV_DETACH_KEY,
    default: false,
  })
  public detach!: boolean

  @Option({
    key: 'workers',
    alias: 'w',
    type: 'number',
    description: `Number of workers to spin. Value between 0 and ${WORKER_COUNT} including.`,
    envKey: ENV_WORKERS_KEY,
    default: WORKER_COUNT,
  })
  public workers!: number

  @Option({
    key: 'bee-repo',
    type: 'string',
    description: 'Docker repository of the Bee images',
    envKey: ENV_REPO_KEY,
    default: DEFAULT_BEE_REPO,
  })
  public beeRepo!: string

  @Option({
    key: 'blockchain-image',
    type: 'string',
    description: 'Docker image name of the used blockchain',
    envKey: 'FDP_PLAY_BLOCKCHAIN_IMAGE',
    default: DEFAULT_BLOCKCHAIN_IMAGE,
  })
  public blockchainImageName!: string

  @Option({
    key: 'bee-image-prefix',
    type: 'string',
    description: 'Docker bee image name prefix',
    envKey: ENV_IMAGE_PREFIX_KEY,
    default: DEFAULT_BEE_IMAGE_PREFIX,
  })
  public beeImagePrefix!: string

  @Option({
    key: 'env-prefix',
    type: 'string',
    description: "Docker container's names prefix",
    envKey: ENV_ENV_PREFIX_KEY,
    default: DEFAULT_ENV_PREFIX,
  })
  public envPrefix!: string

  @Option({ key: 'bee-version', description: 'Bee image version', required: false })
  public beeVersion!: string

  @Option({
    key: 'without-bees',
    type: 'boolean',
    description: 'Start environment without Bee clients',
    required: false,
    default: false,
  })
  public withoutBees!: boolean

  @Option({
    key: 'fairos',
    type: 'boolean',
    description: 'Start FairOS instance',
    required: false,
    default: false,
  })
  public fairos!: boolean

  @Option({ key: 'fairos-image', description: 'FairOS Docker image', required: false, default: DEFAULT_FAIROS_IMAGE })
  public fairosImage!: string

  public async run(): Promise<void> {
    await super.init()

    if (this.workers < 0 || this.workers > WORKER_COUNT) {
      throw new Error(`Worker count has to be between 0 and ${WORKER_COUNT} including.`)
    }

    if (!this.beeVersion) {
      this.beeVersion = 'latest'
      this.console.info('Bee version not specified. Using image with the latest tag')
    }

    this.beeVersion = stripCommit(this.beeVersion)

    const dockerOptions = this.buildDockerOptions()
    const docker = new Docker({
      console: this.console,
      envPrefix: this.envPrefix,
      beeImagePrefix: this.beeImagePrefix,
      blockchainImageName: this.blockchainImageName,
      beeRepo: this.beeRepo,
      fairOsImage: this.fairosImage,
    })
    const status = await docker.getAllStatus()

    if (Object.values(status).every(st => st === 'running')) {
      this.console.log('All containers are up and running')

      if (this.detach) {
        return
      }

      await docker.logs(ContainerType.QUEEN, process.stdout)
    }

    let queenAddress: string

    process.on('SIGINT', async () => {
      try {
        await docker.stopAll(false)
      } catch (e) {
        this.console.error(`Error: ${e}`)
      }

      process.exit()
    })

    const networkSpinner = ora({
      text: 'Spawning network...',
      spinner: 'point',
      color: 'yellow',
      isSilent: this.verbosity === VerbosityLevel.Quiet,
    }).start()

    try {
      await docker.createNetwork()
      networkSpinner.succeed('Network is up')
    } catch (e) {
      networkSpinner.fail(`Impossible to spawn network!`)
      throw e
    }

    const blockchainSpinner = ora({
      text: 'Getting blockchain image version...',
      spinner: 'point',
      color: 'yellow',
      isSilent: this.verbosity === VerbosityLevel.Quiet,
    }).start()

    try {
      blockchainSpinner.text = 'Starting blockchain node...'
      await docker.startBlockchainNode(dockerOptions)
      blockchainSpinner.text = 'Waiting until blockchain is ready...'
      await waitForBlockchain()
      blockchainSpinner.succeed('Blockchain node is up and listening')
    } catch (e) {
      blockchainSpinner.fail(`Impossible to start blockchain node!`)
      await this.stopDocker(docker)
      throw e
    }

    if (this.withoutBees) {
      if (!this.detach) {
        await docker.logs(ContainerType.BLOCKCHAIN, process.stdout, true)
      }

      return
    }

    const queenSpinner = ora({
      text: 'Starting queen Bee node...',
      spinner: 'point',
      color: 'yellow',
      isSilent: this.verbosity === VerbosityLevel.Quiet,
    }).start()

    try {
      await docker.startQueenNode(this.beeVersion, dockerOptions)
      queenSpinner.text = 'Waiting until queen node is ready...'
      queenAddress = await waitForQueen(
        async () => (await docker.getStatusForContainer(ContainerType.QUEEN)) === 'running',
      )
      queenSpinner.succeed('Queen node is up and listening')
    } catch (e) {
      queenSpinner.fail(`Impossible to start queen node: ${(e as Error).message}`)
      await this.stopDocker(docker)
      throw e
    }

    if (this.workers > 0) {
      const workerSpinner = ora({
        text: 'Starting worker Bee nodes...',
        spinner: 'point',
        color: 'yellow',
        isSilent: this.verbosity === VerbosityLevel.Quiet,
      }).start()

      try {
        for (let i = 1; i <= this.workers; i++) {
          await docker.startWorkerNode(this.beeVersion, i, queenAddress, dockerOptions)
        }

        workerSpinner.text = 'Waiting until all workers connect to queen...'
        await waitForWorkers(this.workers, docker.getAllStatus.bind(docker))
        workerSpinner.succeed('Worker nodes are up and listening')
      } catch (e) {
        workerSpinner.fail(`Impossible to start worker nodes!`)
        await this.stopDocker(docker)
        throw e
      }
    }

    // start FairOS instance
    if (this.fairos) {
      const workerSpinner = ora({
        text: 'Starting FairOS node...',
        spinner: 'point',
        color: 'yellow',
        isSilent: this.verbosity === VerbosityLevel.Quiet,
      }).start()

      try {
        await docker.startFairOs(dockerOptions)

        workerSpinner.succeed('FairOS node is up and listening')
      } catch (e) {
        workerSpinner.fail(`Impossible to start FairOS node!`)
        await this.stopDocker(docker)
        throw e
      }

      if (!this.detach) {
        await docker.logs(ContainerType.FAIROS, process.stdout, true)
      }

      return
    }

    if (!this.detach) {
      await docker.logs(ContainerType.QUEEN, process.stdout, true)
    }
  }

  private async stopDocker(docker: Docker) {
    const dockerSpinner = ora({
      text: 'Stopping all containers...',
      spinner: 'point',
      color: 'red',
      isSilent: this.verbosity === VerbosityLevel.Quiet,
    }).start()

    await docker.stopAll(false)

    dockerSpinner.stop()
  }

  private buildDockerOptions(): RunOptions {
    return {
      fresh: this.fresh,
      pullImage: this.pullImage,
    }
  }
}
