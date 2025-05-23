/* eslint-disable no-console */
import Dockerode from 'dockerode'
import crypto from 'crypto'

import { run } from '../utils/run'
import { ENV_ENV_PREFIX_KEY } from '../../src/constants'
import { Bee, Reference } from '@ethersphere/bee-js'
import { DockerError } from '../../src/utils/docker'
import { findContainer, waitForUsablePostageStamp } from '../utils/docker'

let testFailed = false

function wrapper(fn: () => Promise<unknown>): () => Promise<unknown> {
  return async () => {
    try {
      return await fn()
    } catch (e) {
      testFailed = true
      throw e
    }
  }
}

async function stopNodes() {
  await run(['stop', '--rm']) // Cleanup the testing containers
}

describe('start command', () => {
  let docker: Dockerode
  let bee: Bee, beeDebug: Bee
  const envPrefix = `fdp-play-test-${crypto.randomBytes(4).toString('hex')}`

  beforeAll(() => {
    docker = new Dockerode()
    bee = new Bee('http://127.0.0.1:1633')
    beeDebug = new Bee('http://127.0.0.1:1633')

    // This will force Bee Factory to create
    process.env[ENV_ENV_PREFIX_KEY] = envPrefix
  })

  afterEach(async () => {
    if (testFailed) {
      await run(['logs', 'queen'])
    }

    await stopNodes()
  })

  it(
    'should start cluster',
    wrapper(async () => {
      // As spinning the cluster with --detach the command will exit once the cluster is up and running
      await run(['start', '--detach'])

      await expect(findContainer(docker, 'queen')).resolves.toBeDefined()
      await expect(findContainer(docker, 'blockchain')).resolves.toBeDefined()
      await expect(findContainer(docker, 'worker-1')).resolves.toBeDefined()
      await expect(findContainer(docker, 'worker-2')).resolves.toBeDefined()
      await expect(findContainer(docker, 'worker-3')).resolves.toBeDefined()
      await expect(findContainer(docker, 'worker-4')).resolves.toBeDefined()

      await expect(beeDebug.getHealth()).resolves.toHaveProperty('status')
    }),
  )

  describe('should start cluster without bee nodes', () => {
    beforeAll(async () => {
      await stopNodes()
    })

    it(
      '',
      wrapper(async () => {
        // As spinning the cluster with --detach the command will exit once the cluster is up and running
        await run(['start', '--without-bees'])

        await expect(findContainer(docker, 'blockchain')).resolves.toBeDefined()
        await expect(findContainer(docker, 'queen')).rejects.toHaveProperty('statusCode', 404)
        await expect(findContainer(docker, 'worker-1')).rejects.toHaveProperty('statusCode', 404)
        await expect(findContainer(docker, 'worker-2')).rejects.toHaveProperty('statusCode', 404)
        await expect(findContainer(docker, 'worker-3')).rejects.toHaveProperty('statusCode', 404)
        await expect(findContainer(docker, 'worker-4')).rejects.toHaveProperty('statusCode', 404)
      }),
    )
  })

  describe('should start cluster with fairos node', () => {
    beforeAll(async () => {
      await stopNodes()
    })

    it(
      '',
      wrapper(async () => {
        // As spinning the cluster with --detach the command will exit once the cluster is up and running
        await run(['start', '--fairos'])

        await expect(findContainer(docker, 'blockchain')).resolves.toBeDefined()
        await expect(findContainer(docker, 'worker-1')).resolves.toBeDefined()
        await expect(findContainer(docker, 'worker-2')).resolves.toBeDefined()
        await expect(findContainer(docker, 'worker-3')).resolves.toBeDefined()
        await expect(findContainer(docker, 'worker-4')).resolves.toBeDefined()
        await expect(findContainer(docker, 'fairos')).resolves.toBeDefined()
      }),
    )
  })

  describe('should start cluster with just few workers', () => {
    beforeAll(async () => {
      await stopNodes()
    })

    it(
      '',
      wrapper(async () => {
        // As spinning the cluster with --detach the command will exit once the cluster is up and running
        await run(['start', '--detach', '--workers', '2'])

        await expect(findContainer(docker, 'queen')).resolves.toBeDefined()
        await expect(findContainer(docker, 'blockchain')).resolves.toBeDefined()
        await expect(findContainer(docker, 'worker-1')).resolves.toBeDefined()
        await expect(findContainer(docker, 'worker-2')).resolves.toBeDefined()
        await expect(findContainer(docker, 'worker-3')).rejects.toHaveProperty('statusCode', 404)
        await expect(findContainer(docker, 'worker-4')).rejects.toHaveProperty('statusCode', 404)

        await expect(beeDebug.getHealth()).resolves.toHaveProperty('status')
      }),
    )
  })

  describe('should create docker network', () => {
    beforeAll(async () => {
      await stopNodes()

      try {
        // Make sure the network does not exists
        await docker.getNetwork(`${envPrefix}-network`).remove()
      } catch (e) {
        if ((e as DockerError).statusCode !== 404) {
          throw e
        }
      }
    })

    it(
      '',
      wrapper(async () => {
        await run(['start', '--detach', '--without-bees'])

        expect(docker.getNetwork(`${envPrefix}-network`)).toBeDefined()
      }),
    )
  })

  describe('should remove containers with --fresh option', () => {
    let reference: Reference, data: string

    beforeAll(async () => {
      console.log('(before) Starting up Bee Factory')
      await run(['start', '--detach'])

      console.log('(before) Creating postage stamp ')
      const postage = await beeDebug.createPostageBatch('414720000', 18)

      console.log('(before) Waiting for the postage stamp to be usable')
      await waitForUsablePostageStamp(beeDebug, postage)
      data = `hello from ${Date.now()}`
      reference = (await bee.uploadData(postage, data, { deferred: false })).reference

      // Lets just verify that it the current container has the data
      expect((await bee.downloadData(reference)).text()).toEqual(data)

      console.log('(before) Stopping the Bee Factory')
      await run(['stop'])
    })

    it(
      '',
      wrapper(async () => {
        console.log('(test) Starting the Bee Factory')
        await run(['start', '--fresh', '--detach'])

        console.log('(test) Trying to fetch the data')
        // locally 'timeout of 1000ms exceeded'
        // ci 'Request failed with status code 404'
        expect(bee.downloadData(reference, { timeout: 1000 })).rejects.toBeTruthy()
      }),
    )
  })
})
