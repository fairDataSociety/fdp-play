import { LeafCommand, Option } from 'furious-commander'
import * as ethers from 'ethers'
import { EthCommand } from './eth-command'
import { isNumberString } from '../../utils/types'
import { CommandLineError } from '../../utils/error'
import { BLOCKCHAIN_WALLET_ADDR } from '../../constants'

export class Send extends EthCommand implements LeafCommand {
  public readonly name = 'send'

  public readonly description = 'Send ethers from one unlocked account.'

  @Option({
    key: 'amount',
    alias: 'a',
    type: 'string',
    description: 'How many ethers should be sent to the recipient.',
    required: true,
  })
  public amount!: string

  @Option({
    key: 'to',
    type: 'string',
    description: 'The Ethereum address of the recipient.',
    required: true,
  })
  public to!: string

  @Option({
    key: 'from',
    type: 'string',
    description: 'The wallet address from which the coins will be sent.',
    default: BLOCKCHAIN_WALLET_ADDR,
  })
  public from!: string

  public async run(): Promise<void> {
    await super.init()

    const account = this.provider.getSigner(this.from)

    if (!account) {
      throw new CommandLineError(`There is no account on index ${this.from}.`)
    }

    if (!isNumberString(this.amount)) {
      throw new CommandLineError(`Given value ${this.amount} is not a valid`)
    }

    const tx = {
      to: this.to,
      value: '0x' + BigInt(ethers.utils.parseEther(this.amount).toString()).toString(16),
    }

    try {
      const response = await account.sendTransaction(tx)
      this.console.info(`${this.amount} ETH has been sent to ${this.to}.`)
      this.console.log(`TxId: ${response}`)
    } catch (e) {
      const errMessage = (e as Error).message || e
      throw new CommandLineError(`Cannot execute transaction: ${errMessage}`)
    }
  }
}
