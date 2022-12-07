import { RootCommand } from '../root-command'
import { providers } from 'ethers'
import { CommandLineError } from '../../utils/error'
import { BLOCKCHAIN_NETWORK_ID, BLOCKCHAIN_RPC_EP } from '../../constants'

export class EthCommand extends RootCommand {
  protected provider = new providers.JsonRpcProvider(BLOCKCHAIN_RPC_EP)

  protected async init(): Promise<void> {
    await super.init()

    const network = await this.provider.getNetwork()

    if (network.chainId !== BLOCKCHAIN_NETWORK_ID) {
      throw new CommandLineError(
        `The RPC connection operates on different network ID than the expected 4020. Got: ${network.chainId}`,
      )
    }
  }
}
