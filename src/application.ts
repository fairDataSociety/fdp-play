import { Application } from 'furious-commander/dist/application'
import PackageJson from '../package.json'

export const application: Application = {
  name: 'FDP Play',
  command: 'fdp-play',
  description: 'Orchestration CLI for spinning up local development Bee cluster and FDP environment with Docker',
  version: PackageJson.version,
  autocompletion: 'fromOption',
}
