import Dockerode from 'dockerode'
import { ENV_ENV_PREFIX_KEY } from '../../src/constants'
import { BatchId, BeeDebug } from '@ethersphere/bee-js'

export async function findContainer(docker: Dockerode, name: string): Promise<Dockerode.ContainerInspectInfo> {
  const containerName = `${process.env[ENV_ENV_PREFIX_KEY]}-${name}`
  const sleepTimeMs = 3000
  const trials = 150
  for (let i = 0; i < trials; i++) {
    try {
      const getContainer = await docker.getContainer(containerName).inspect()

      return getContainer
    } catch (e) {
      sleep(sleepTimeMs)
    }
  }

  throw new Error(
    `Container "${containerName}" has been not initialized within ${(sleepTimeMs * trials) / 1000} seconds`,
  )
}

export async function sleep(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

export async function waitForUsablePostageStamp(beeDebug: BeeDebug, id: BatchId, timeout = 30_000): Promise<void> {
  const TIME_STEP = 1500
  for (let time = 0; time < timeout; time += TIME_STEP) {
    // it is in a try...catch because after postage creation Bee (1.8.2) does not find stamp immediately somehow
    try {
      const stamp = await beeDebug.getPostageBatch(id)

      if (stamp.usable) {
        return
      }

      await sleep(TIME_STEP)
    } catch (e) {
      await sleep(TIME_STEP)
    }
  }

  throw new Error('Timeout on waiting for postage stamp to become usable')
}
