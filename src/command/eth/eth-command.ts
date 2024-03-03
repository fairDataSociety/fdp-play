import { RootCommand } from '../root-command'
import { BLOCKCHAIN_NETWORK_ID, BLOCKCHAIN_RPC_EP } from '../../constants'
import { CommandLineError } from '../../utils/error'
import { BlockchainApi } from '../../utils/blockchain/api'

export class EthCommand extends RootCommand {
  protected provider = new BlockchainApi(BLOCKCHAIN_RPC_EP)

  protected async init(): Promise<void> {
    await super.init()
    const chainId = await this.provider.chainId()

    if (chainId !== BLOCKCHAIN_NETWORK_ID) {
      throw new CommandLineError(
        `The RPC connection operates on different network ID than the expected 4020. Got: ${chainId}`,
      )
    }
  }
}
