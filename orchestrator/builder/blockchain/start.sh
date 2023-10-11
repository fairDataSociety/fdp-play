#!/bin/bash
set -o errexit
set -o pipefail

MY_PATH=$(dirname "$0")
MY_PATH=$( cd "$MY_PATH" && pwd )
# Check used system variable set
BEE_ENV_PREFIX=$("$MY_PATH/../utils/env-variable-value.sh" BEE_ENV_PREFIX)
BEE_IMAGE_PREFIX=$("$MY_PATH/../utils/env-variable-value.sh" BEE_IMAGE_PREFIX)
BLOCKCHAIN_VERSION=$("$MY_PATH/../utils/env-variable-value.sh" BLOCKCHAIN_VERSION)
NETWORK="$BEE_ENV_PREFIX-network"
NAME="$BEE_ENV_PREFIX-blockchain"
CONTAINER_IN_DOCKER=$(docker container ls -qaf name=$NAME)

if [ -z "$CONTAINER_IN_DOCKER" ]; then
    docker run -p 9545:9545 --network $NETWORK --name $NAME -v $MY_PATH:/root -d \
        ethereum/client-go --allow-insecure-unlock \
        --unlock 0xCEeE442a149784faa65C35e328CCd64d874F9a02 --password /root/password \
        --mine --miner.etherbase=0xCEeE442a149784faa65C35e328CCd64d874F9a02 \
        --http --http.api="debug,web3,eth,txpool,net,personal,db" --http.corsdomain=* --http.port=9545 --http.addr=0.0.0.0 \
        --maxpeers=0 --networkid=4020 --authrpc.vhosts=* --authrpc.addr=0.0.0.0 --http.vhosts=*
else
  docker start $NAME
fi
