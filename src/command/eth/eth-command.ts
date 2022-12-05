import { RootCommand } from '../root-command'
import { providers } from 'ethers'
import { CommandLineError } from '../../utils/error'

export class EthCommand extends RootCommand {
  protected provider = new providers.JsonRpcProvider('http://localhost:9545')

  protected async init(): Promise<void> {
    await super.init()

    const network = await this.provider.getNetwork()

    if (network.chainId !== 4020) {
      throw new CommandLineError(
        `The RPC connection operates on different network ID than the expected 4020. Got: ${network.chainId}`,
      )
    }
  }
}
