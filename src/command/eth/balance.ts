import { Argument, LeafCommand } from 'furious-commander'
import { EthCommand } from './eth-command'
import { utils } from 'ethers'

export class Balance extends EthCommand implements LeafCommand {
  public readonly name = 'balance'

  public readonly description = 'Shows balance under the given ethereum address.'

  @Argument({
    key: 'address',
    type: 'string',
    description: 'The ethereum address of which balance will be printed.',
    required: true,
  })
  public address!: string

  public async run(): Promise<void> {
    await super.init()

    const amount = await this.provider.getBalance(this.address)
    this.console.log(`${utils.formatEther(amount)} ETH`)
  }
}
