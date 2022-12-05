import { RootCommand } from '../root-command'
import { providers } from 'ethers'

export class EthCommand extends RootCommand {
  protected provider = new providers.JsonRpcProvider('http://localhost:9545')

  protected async init(): Promise<void> {
    await super.init()
  }
}
