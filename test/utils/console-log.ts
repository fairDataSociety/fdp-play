type describeFunctionArgs = {
  consoleMessages: string[]
  getNthLastMessage: (n: number) => string
  getLastMessage: () => string
  hasMessageContaining: (substring: string) => boolean
}

export function describeCommand(description: string, func: (clauseFields: describeFunctionArgs) => void): void {
  describe(description, () => {
    const consoleMessages: string[] = []
    const getNthLastMessage = (n: number) => consoleMessages[consoleMessages.length - n]
    const getLastMessage = () => consoleMessages[consoleMessages.length - 1]
    const hasMessageContaining = (substring: string) =>
      Boolean(consoleMessages.find(consoleMessage => consoleMessage.includes(substring)))

    global.console.log = jest.fn(message => {
      consoleMessages.push(message)
    })
    global.console.error = jest.fn(message => {
      consoleMessages.push(message)
    })

    global.process.stdout.write = jest.fn(message => {
      if (typeof message === 'string') {
        consoleMessages.push(message)
      } else {
        consoleMessages.push(new TextDecoder().decode(message))
      }

      return true
    })

    jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit() was called')
    })

    jest.spyOn(global.console, 'warn')

    beforeEach(() => {
      consoleMessages.length = 0
    })

    func({ consoleMessages, getNthLastMessage, getLastMessage, hasMessageContaining })
  })
}
