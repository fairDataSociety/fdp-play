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
- [Blockchain](#blockchain)
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
$ fdp-play eth send --to 0xb0baf37740204020402040204020402040204020 -a 0.5

# Query the ETH balance of any Ethereum address
$ fdp-play eth balance 0xCEeE442a149784faa65C35e328CCd64d874F9a02
```

For more details see the `--help` page of the CLI and its commands.

## Blockchain

A [go-ethereum](https://geth.ethereum.org/) node is runnig for operating blockchain in the FDP Play environment.
Set http://localhost:9545 for RPC connection and its websocket connection is available on ws://localhost:9546.

The CLI offers some interactions with the blockchain with the `fdp-play eth` subcommands.

A new block is generated every 5 seconds.

### Funded Wallets

Some addresses are pre-funded on the [fdp-play-blockchain](https://hub.docker.com/r/fairdatasociety/fdp-play-blockchain) 
[by the genesis block](orchestrator/builder/blockchain/genesis.json).

All legacy test wallets (from Ganache era) are funded with 1000 ETH:
```
Wallet addresses
==================
(0) 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 (1000 ETH) -> minus expenses for contract creations
(1) 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0 (1000 ETH)
(2) 0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b (1000 ETH)
(3) 0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d (1000 ETH)
(4) 0xd03ea8624C8C5987235048901fB614fDcA89b117 (1000 ETH)
(5) 0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC (1000 ETH)
(6) 0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9 (1000 ETH)
(7) 0x28a8746e75304c0780E011BEd21C72cD78cd535E (1000 ETH)
(8) 0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E (1000 ETH)
(9) 0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e (1000 ETH)

Private Keys
==================
(0) 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
(1) 0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1
(2) 0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c
(3) 0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913
(4) 0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743
(5) 0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd
(6) 0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52
(7) 0xa453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3
(8) 0x829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4
(9) 0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773
```

Additionally, the miner account - its wallet is in the [geth data folder](orchestrator/builder/blockchain/.ethereum) -
is also founded with 1000 ETH. Its address is `0xCEeE442a149784faa65C35e328CCd64d874F9a02`.

With the geth wallet any sort of action can be performed since it is unlocked and all API services are open.

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
