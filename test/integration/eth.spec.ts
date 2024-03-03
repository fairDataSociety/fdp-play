/* eslint-disable no-console */
import crypto from 'crypto'
import * as ethers from 'ethers'

import { run } from '../utils/run'
import { ENV_ENV_PREFIX_KEY } from '../../src/constants'
import { describeCommand } from '../utils/console-log'
import { sleep } from '../../src/utils'

describeCommand('stop command', ({ getLastMessage }) => {
  const envPrefix = `bee-play-test-${crypto.randomBytes(4).toString('hex')}`

  beforeAll(async () => {
    // This will force Bee Factory to create
    process.env[ENV_ENV_PREFIX_KEY] = envPrefix

    // As spinning the cluster with --detach the command will exit once the cluster is up and running
    await run(['start', '--detach', '--without-bees'])
  })

  afterAll(async () => {
    await run(['stop', '--rm']) // Cleanup the testing containers
  })

  it('should send ether and update balance', async () => {
    const wallet = ethers.Wallet.createRandom()
    const blockTime = 6000 // more than one block time in fdp-play

    await run(['eth', 'balance', wallet.address])
    expect(getLastMessage()).toBe('0.0 ETH')

    await run(['eth', 'send', '--to', wallet.address, '--amount', '0.1'])
    expect(getLastMessage()).toContain('TxId')

    await sleep(blockTime)

    await run(['eth', 'balance', wallet.address])
    expect(getLastMessage()).toBe('0.1 ETH')

    await run(['eth', 'send', '--to', wallet.address, '--amount', '0.9'])
    expect(getLastMessage()).toContain('TxId')

    await sleep(blockTime)

    await run(['eth', 'balance', wallet.address])
    expect(getLastMessage()).toBe('1.0 ETH')

    await run(['eth', 'send', '--to', wallet.address, '--amount', '100000000000000'])
    expect(getLastMessage()).toContain('jsonrpc: -32000 - insufficient funds for transfer')

    await run(['eth', 'send', '--to', '0xD293493418172', '--amount', '100000000000000'])
    expect(getLastMessage()).toContain('jsonrpc: -32602')

    await run(['eth', 'balance', '0xD293493418172'])
    expect(getLastMessage()).toContain('jsonrpc: -32602')
  })
})
