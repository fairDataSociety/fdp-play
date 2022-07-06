import { readFile as readFileCb } from 'fs'
import { promisify } from 'util'

const readFile = promisify(readFileCb)
const VERSION_REGEX = /^\d\.\d\.\d(-\w+)*$/

export function stripCommit(version: string): string {
  if (version === 'latest') {
    return version
  }

  if (!VERSION_REGEX.test(version)) {
    throw new Error('The version does not have expected format!')
  }

  // If the version contains commit ==> hash remove it
  return version.replace('-stateful', '').replace(/-[0-9a-fA-F]{8}$/, '')
}
