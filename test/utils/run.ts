import { cli } from 'furious-commander'
import { optionParameters, rootCommandClasses } from '../../src/config'
import { errorHandler } from '../../src/utils/error'

export async function run(argv: string[]): ReturnType<typeof cli> {
  const commandBuilder = await cli({
    rootCommandClasses,
    optionParameters,
    testArguments: argv,
    errorHandler,
  })

  return commandBuilder
}
