#!/bin/bash
set -o errexit
set -o pipefail

MY_PATH=$(dirname "$0")
MY_PATH=$( cd "$MY_PATH" && pwd )
# Check used system variable set
BEE_ENV_PREFIX=$("$MY_PATH/../utils/env-variable-value.sh" BEE_ENV_PREFIX)
BLOCKCHAIN_RUN_ARGS=$("$MY_PATH/../utils/env-variable-value.sh" BLOCKCHAIN_RUN_ARGS)
NETWORK="$BEE_ENV_PREFIX-network"
NAME="$BEE_ENV_PREFIX-blockchain"
CONTAINER_IN_DOCKER=$(docker container ls -qaf name=$NAME)

if [ -z "$CONTAINER_IN_DOCKER" ]; then
    exec docker run -p 127.0.0.1:9545:9545 --network $NETWORK --name $NAME -v "$MY_PATH:/root" -d \
        ethereum/client-go:release-1.13 $BLOCKCHAIN_RUN_ARGS
else
    docker start $NAME
fi
