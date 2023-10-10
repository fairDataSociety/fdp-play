#!/bin/bash
# doc: https://geth.ethereum.org/docs/fundamentals/private-network
MY_PATH=$(dirname "$0")
MY_PATH=$( cd "$MY_PATH" && pwd )

docker run --rm -v $MY_PATH:/root ethereum/client-go account new --password /root/password
read -p "Update genesis.json and start.sh with the generated address before moving on" continue
docker run -v $MY_PATH:/root ethereum/client-go init /root/genesis.json
echo "Build the docker image of the blockchain with docker-build.sh"
