# FDP Play

[![Tests](https://github.com/fairDataProtocol/fdp-play/actions/workflows/test.yaml/badge.svg)](https://github.com/fairDataProtocol/fdp-play/actions/workflows/test.yaml)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FfairDataProtocol%2Ffdp-play.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%fairDataProtocol%fdp-play?ref=badge_shield)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D6.9.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D12.0.0-orange.svg?style=flat-square)

> CLI tool to spin up local development Bee cluster and FDP environment with Docker

**Warning: This project is in beta state. There might (and most probably will) be changes in the future to its API and working. Also, no guarantees can be made about its stability, efficiency, and security at this stage.**

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)

## Install

**Requirements:** Docker

```shell
$ npm install -g @fairdatasociety/fdp-play
```

## Usage

```shell
# This spins up the cluster for specific Bee version and exits
$ fdp-play start --detach 1.6.1

# The spins up the cluster using Bee version configured in external places. See bellow for options where to place it.
$ fdp-play start --detach

# The spins up the cluster using specific blockchain image.
# NOTE: The fairdatasociety/fdp-play-blockchain is the base blockchain image that only contains pre-funded accounts for Bee nodes.
$ fdp-play start --detach --blockchain-image fairdatasociety/fdp-play-blockchain

# This attaches to the Queen container and displays its logs
$ fdp-play logs queen --follow

# This stops the cluster and keeping the containers so next time they are spinned up the data are kept
# but data are not persisted across version's bump!
$ fdp-play stop

# You can also spin up the cluster without the --detach which then directly
# attaches to the Queen logs and the cluster is terminated upon SIGINT (Ctrl+C)
$ fdp-play start 1.6.1
```

For more details see the `--help` page of the CLI and its commands.

### External Bee version configuration

You can omit the Bee version argument when running `fdp-play start` command if you specify it in one of the expected places:

 - `package.json` placed in current working directory (cwd) under the `engines.bee` property.
 - `.beefactory.json` placed in current working directory (cwd) with property `version`.

### Docker Images

Bee Factory as the NPM package that you can install, like mentioned above, works in a way that it orchestrates launching FDP Play Docker images
in correct order and awaits for certain initializations to happen in correct form. These Docker images are automatically built with our CI
upon every new Bee release, so you can just specify which version you want to run (starting with `1.6.1` version) as part of the `start` command.

#### Latest versions

There is special Bee Factory image tag `latest` that has the latest Bee's master build.
It is not recommended using this tag unless you need to test some upcoming feature and know what are you doing.
There is high chance that there might be some change in Bee that is not compatible with current Bee Factory and so it might not even work.

## Contribute

There are some ways you can make this module better:

- Consult our [open issues](https://github.com/fairDataProtocol/fdp-play/issues) and take on one of them
- Help our tests reach 100% coverage!
- Join us in our [Discord chat](https://discord.gg/C9DDaJ9v) in the #fdp-general channel if you have questions or want to give feedback

### Developing

You can run the CLI while developing using `npm start -- <command> ...`.

## Maintainers

- [nugaon](https://github.com/nugaon)
- [IgorShadurin](https://github.com/IgorShadurin)

## License

[BSD-3-Clause](./LICENSE)
