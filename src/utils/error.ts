import { printer } from '../printer'
import chalk from 'chalk'

const FORMATTED_ERROR = chalk.red.bold('ERROR')

export class CommandLineError extends Error {
  public readonly type = 'CommandLineError'
}

/**
 * Thrown when the error is not related to Bee/network
 */
export class TimeoutError extends CommandLineError {}

export class ContainerImageConflictError extends CommandLineError {
  existingContainersImage: string
  newContainersImage: string

  constructor(message: string, existingContainersImage: string, newContainersImage: string) {
    super(message)
    this.existingContainersImage = existingContainersImage
    this.newContainersImage = newContainersImage
  }
}

function getFieldOrNull<T>(some: unknown, key: string): T | null {
  return typeof some === 'object' && some !== null ? Reflect.get(some, key) : null
}

export function errorHandler(error: unknown): void {
  if (!process.exitCode) {
    process.exitCode = 1
  }
  // grab error.message, or error if it is a string
  const message: string | null = typeof error === 'string' ? error : getFieldOrNull(error, 'message')

  if (message) {
    printer.printError(FORMATTED_ERROR + ' ' + message)
  } else {
    printer.printError(FORMATTED_ERROR + ' The command failed, but there is no error message available.')
    printer.printError('')
    printer.printError('There may be additional information in the Blockhain, Bee or FairOS logs.')
  }
}
