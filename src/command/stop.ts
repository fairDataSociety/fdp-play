import { LeafCommand, Option } from 'furious-commander'
import { RootCommand } from './root-command'
import { DEFAULT_ENV_PREFIX, DEFAULT_BEE_IMAGE_PREFIX, Docker } from '../utils/docker'
import ora from 'ora'
import { VerbosityLevel } from './root-command/logging'
import { DEFAULT_BLOCKCHAIN_IMAGE, ENV_ENV_PREFIX_KEY } from '../constants'

export class Stop extends RootCommand implements LeafCommand {
  public readonly name = 'stop'

  public readonly description = 'Stops the Bee Factory cluster'

  @Option({
    key: 'env-prefix',
    type: 'string',
    description: "Docker container's names prefix",
    envKey: ENV_ENV_PREFIX_KEY,
    default: DEFAULT_ENV_PREFIX,
  })
  public envPrefix!: string

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
    envKey: 'FACTORY_DOCKER_PREFIX',
    default: DEFAULT_BEE_IMAGE_PREFIX,
  })
  public beeImagePrefix!: string

  @Option({
    key: 'rm',
    type: 'boolean',
    description: 'Remove the containers',
  })
  public deleteContainers!: boolean

  public async run(): Promise<void> {
    await super.init()

    const docker = new Docker({
      console: this.console,
      envPrefix: this.envPrefix,
      beeImagePrefix: this.beeImagePrefix,
      blockchainImageName: this.blockchainImageName,
    })

    const dockerSpinner = ora({
      text: 'Stopping all containers...',
      spinner: 'point',
      color: 'yellow',
      isSilent: this.verbosity === VerbosityLevel.Quiet,
    }).start()

    await docker.stopAll(true, this.deleteContainers)

    dockerSpinner.succeed('Containers stopped')
  }
}
