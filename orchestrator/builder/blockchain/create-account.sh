#!/bin/bash
# doc: https://geth.ethereum.org/docs/fundamentals/private-network
MY_PATH=$(dirname "$0")
MY_PATH=$( cd "$MY_PATH" && pwd )

docker run --rm -v $MY_PATH:/root ethereum/client-go:release-1.13 account new --password /root/password
echo "Update genesis.json and start.sh with the generated address before moving on" continue