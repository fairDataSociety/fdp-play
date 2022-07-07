#!/bin/bash

set -o errexit
set -o pipefail

MY_PATH=$(dirname "$0")
MY_PATH=$( cd "$MY_PATH" && pwd )

STATE_COMMIT=$("$MY_PATH/utils/env-variable-value.sh" STATE_COMMIT)
BUILD_IMAGE=$("$MY_PATH/utils/env-variable-value.sh" BUILD_IMAGE)
BLOCKCHAIN_VERSION=$("$MY_PATH/utils/env-variable-value.sh" BLOCKCHAIN_VERSION)

if [ $BUILD_IMAGE == 'true' ] ; then
  # Necessary for fetch BEE_VERSION from .commit-version-tag
  export COMMIT_VERSION_TAG='true'
fi

BEE_VERSION=$("$MY_PATH/utils/build-image-tag.sh" get)

if [ $STATE_COMMIT == 'true' ] ; then
  BLOCKCHAIN_VERSION+="-for-$BEE_VERSION"
fi

BEE_ENV_PREFIX=$("$MY_PATH/utils/env-variable-value.sh" BEE_ENV_PREFIX)
BEE_IMAGE_PREFIX=$("$MY_PATH/utils/env-variable-value.sh" BEE_IMAGE_PREFIX)
BLOCKCHAIN_NAME="$BEE_ENV_PREFIX-blockchain"
BLOCKCHAIN_IMAGE_NAME="$BEE_IMAGE_PREFIX/$BLOCKCHAIN_NAME:$BLOCKCHAIN_VERSION"

LATEST=false
# handle passed options
while [ $# -gt 0 ]
do
    case "$1" in
        --latest)
        LATEST=true
        shift 1
        ;;
        *)
        echoerr "Unknown argument: $1"
        usage
        ;;
    esac
done

echo "Search Docker built images with the following parameters: $BEE_IMAGE_PREFIX/$BEE_ENV_PREFIX*:$BEE_VERSION"
DOCKER_IMAGES=$(docker image ls --format "{{.Repository}}:{{.Tag}}" -af reference="$BEE_IMAGE_PREFIX/$BEE_ENV_PREFIX*:$BEE_VERSION")
echo "Push Bee docker images: $DOCKER_IMAGES"
for DOCKER_IMAGE in $DOCKER_IMAGES
do
  echo "$DOCKER_IMAGE"
  docker push "$DOCKER_IMAGE"

  if $LATEST ; then
    docker tag "$DOCKER_IMAGE" "${DOCKER_IMAGE%:*}:latest"
    docker push "${DOCKER_IMAGE%:*}:latest"
  fi
done

echo "Push Blockchain docker image: $BLOCKCHAIN_IMAGE_NAME"
docker push "$BLOCKCHAIN_IMAGE_NAME"

if $LATEST ; then
  docker tag "$BLOCKCHAIN_IMAGE_NAME" "${BLOCKCHAIN_IMAGE_NAME%:*}:latest"
  docker push "${BLOCKCHAIN_IMAGE_NAME%:*}:latest"
fi
