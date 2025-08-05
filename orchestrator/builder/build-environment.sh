#!/bin/bash

set -o errexit
set -o pipefail

usage() {
    cat << USAGE >&2
USAGE:
    $ build-environment.sh [PARAMETERS]
PARAMETERS:
    --build-base-bee                          The base bee image will be built from source code
    --base-bee-commit-hash=string             the source code commit hash of the base bee; Default: HEAD; Dependency: --build-base-bee
USAGE
    exit 1
}

echoerr() {
     >&2 echo "$@"
}

build_bee() {
    # Clone source code
    BEE_SOURCE_PATH=$MY_PATH/../bee
    if [ -d "$BEE_SOURCE_PATH" ] ; then
        rm -rf "$BEE_SOURCE_PATH"
    fi
    mkdir "$BEE_SOURCE_PATH" && cd "$BEE_SOURCE_PATH" || exit 1
    git init
    git remote add origin https://github.com/ethersphere/bee.git
    git fetch origin --depth=1 "$COMMIT_HASH"
    git reset --hard FETCH_HEAD
    # Build bee and make docker image
    export BEE_VERSION=${COMMIT_HASH::7}-commit
    export REACHABILITY_OVERRIDE_PUBLIC=true
    echo "Bee image will be built with version: $BEE_VERSION"
    docker build . -t ethersphere/bee:$BEE_VERSION --build-arg REACHABILITY_OVERRIDE_PUBLIC=$REACHABILITY_OVERRIDE_PUBLIC
    cd "$MY_PATH" || exit 1
    # Set build image tag so that other terminal session can retrieve
    "$MY_PATH/utils/build-image-tag.sh" set "$BEE_VERSION"
}

MY_PATH=$(dirname "$0")
MY_PATH=$( cd "$MY_PATH" && pwd )
COMMIT_HASH=HEAD
BUILD_BASE_BEE=false
# Bee version here means the base bee version on which the images will be built
BEE_VERSION=$("$MY_PATH/utils/env-variable-value.sh" BEE_VERSION)

# handle passed options
while [ $# -gt 0 ]
do
    case "$1" in
        --build-base-bee)
        BUILD_BASE_BEE=true
        shift 1
        ;;
        --base-bee-commit-hash=*)
        COMMIT_HASH="${1#*=}"
        shift 1
        ;;
        *)
        echoerr "Unknown argument: $1"
        usage
        ;;
    esac
done

# cleanup for start from an empty state
"$MY_PATH/bee-cleanup.sh"

if $BUILD_BASE_BEE ; then
    build_bee
fi
"$MY_PATH/network.sh"
"$MY_PATH/blockchain/init.sh"
"$MY_PATH/blockchain/start.sh"
SLEEP_TIME=10
echo "wait $SLEEP_TIME seconds for blockchain connection"
sleep $SLEEP_TIME
docker logs fdp-play-blockchain
npm run migrate:contracts
npm run supply
chmod -R 777 "$MY_PATH/bee-data-dirs/"

"$MY_PATH/bee-docker-build.sh"
"$MY_PATH/blockchain/docker-build.sh"
