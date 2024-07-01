#!/bin/bash
# doc: https://geth.ethereum.org/docs/fundamentals/private-network
MY_PATH=$(dirname "$0")
MY_PATH=$( cd "$MY_PATH" && pwd )

docker run --rm -v $MY_PATH:/root ethereum/client-go:release-1.13 init /root/genesis.json
echo "Build the docker image of the blockchain with docker-build.sh after migrating and supplying"
