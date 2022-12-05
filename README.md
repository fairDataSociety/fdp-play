# FDP Play

[![Tests](https://github.com/fairDataSociety/fdp-play/actions/workflows/test.yaml/badge.svg)](https://github.com/fairDataSociety/fdp-play/actions/workflows/test.yaml)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D6.9.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D12.0.0-orange.svg?style=flat-square)

> CLI tool to spin up local development Bee cluster and FDP environment with Docker

**Warning: This project is in beta state. There might (and most probably will) be changes in the future to its API and working. Also, no guarantees can be made about its stability, efficiency, and security at this stage.**

## [Short tutorial video](https://www.youtube.com/watch?v=Mt5468WzWaA) ▶️ ⏯️

## Table of Contents
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [Maintainers](#maintainers)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Install

**Requirements:** Docker

```shell
$ npm install -g @fairdatasociety/fdp-play
```

## Usage

```shell
# Listing of available commands and print help menu
$ fdp-play --help

# The spins up the cluster using the latest supported Bee version.
$ fdp-play start --detach

# This spins up the cluster for specific Bee version and exits
$ fdp-play start -d --bee-version 1.6.1

# This spins up the environment without Bee nodes
$ fdp-play start --without-bees

# Or start a fairOS instance that will use the Queen Bee node.
$ fdp-play start --fairos

# This will clean the containers before start (fresh) and tries to pull the latest images from the Docker repository (pull)
# NOTE: best to use this if something went wrong.
$ fdp-play start --pull --fresh

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
$ fdp-play start

# Send ETH to any address
$ fdp-play eth send --to 0xD2934934181720d2f17D37CBcB421dbEa3d3f805 -a 0.5

# Query the ETH balance of any Ethereum address
$ fdp-play eth balance 0xD2934934181720d2f17D37CBcB421dbEa3d3f805
```

For more details see the `--help` page of the CLI and its commands.

### Docker Images

Bee Factory as the NPM package that you can install, like mentioned above, works in a way that it orchestrates launching FDP Play Docker images
in correct order and awaits for certain initializations to happen in correct form.

## Contribute

There are some ways you can make this module better:

- Consult our [open issues](https://github.com/fairDataSociety/fdp-play/issues) and take on one of them
- Help our tests reach 100% coverage!
- Join us in our [FDS Discord chat](https://discord.gg/KrVTmahcUA) in the #fdp-general channel if you have questions or want to give feedback

### Developing

You can run the CLI while developing using `npm start -- <command> ...`.

## Maintainers

- [nugaon](https://github.com/nugaon)
- [IgorShadurin](https://github.com/IgorShadurin)

## Troubleshooting

### Message: Failed to run command : connect EACCES /var/run/docker.sock
Running `npm` +  `command` results in message:
```
█ Failed to run command!

connect EACCES /var/run/docker.sock
```

Try troubleshooting Docker as guided on [Stackoverflow thread](https://stackoverflow.com/questions/52364905/after-executing-following-code-of-dockerode-npm-getting-error-connect-eacces-v).  

## License

[BSD-3-Clause](./LICENSE)
