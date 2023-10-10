#!/bin/bash
set -o errexit
set -o pipefail

MY_PATH=$(dirname "$0")
MY_PATH=$( cd "$MY_PATH" && pwd )
# Check used system variable set
BEE_ENV_PREFIX=$("$MY_PATH/../utils/env-variable-value.sh" BEE_ENV_PREFIX)
BEE_IMAGE_PREFIX=$("$MY_PATH/../utils/env-variable-value.sh" BEE_IMAGE_PREFIX)
BLOCKCHAIN_VERSION=$("$MY_PATH/../utils/env-variable-value.sh" BLOCKCHAIN_VERSION)

echo "Blockchain will have image version: $BLOCKCHAIN_VERSION"

NAME="$BEE_ENV_PREFIX-blockchain"

echo "Make blockchain docker image"
sudo chown $(id -u) -R $MY_PATH/.ethereum
docker build $MY_PATH -t $BEE_IMAGE_PREFIX/$NAME:$BLOCKCHAIN_VERSION
