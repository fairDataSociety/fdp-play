import { GroupCommand } from 'furious-commander'
import { Balance } from './balance'
import { Send } from './send'

export class Eth implements GroupCommand {
  public readonly name = 'eth'

  public readonly description = 'Blockchain related operations.'

  public subCommandClasses = [Send, Balance]
}
