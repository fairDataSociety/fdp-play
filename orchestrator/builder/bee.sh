#!/bin/bash

set -o errexit
set -o pipefail

echoerr() { if [[ $QUIET -ne 1 ]] ; then echo "$@" 1>&2; fi }

usage() {
    cat << USAGE >&2
USAGE:
    $ bee.sh [COMMAND] [PARAMETERS]
COMMANDS:
    start                       create Bee cluster with the given parameters
    stop                        stop Bee cluster
PARAMETERS:
    --restrict=string           turns on Restricted API support with given string as password
    --ephemeral                 create ephemeral container for bee-client. Data won't be persisted.
    --workers=number            all Bee nodes in the test environment. Default is 4.
    --port-maps=number          map ports of the cluster nodes to the hosting machine in the following manner:
                                1. 1633:1634
                                2. 11633:11634
                                3. 21633:21634 (...)
                                number represents the nodes number to map from. Default is 2.
    --password=string           password for Bee client(s).
    --own-image                 If passed, the used Docker image names will be identical as the name of the workers.
    --version=x.y.z             used version of Bee client.
    --detach                    It will not log the output of Queen node at the end of the process.
USAGE
    exit 1
}

stop_containers() {
    echo "Stop Bee following containers:"
    docker container stop "$QUEEN_CONTAINER_NAME";
    WORKER_NAMES=$(docker container ls -f name="$WORKER_CONTAINER_NAME*" --format "{{.Names}}")
    for WORKER_NAME in $WORKER_NAMES; do
        docker container stop "$WORKER_NAME"
    done
}

stop() {
    stop_containers
    trap - SIGINT
    exit 0;
}

queen_failure() {
    docker logs "$QUEEN_CONTAINER_NAME"
    stop_containers
    echo "Some error occured, exit from the process.."
    exit 1
}

check_queen_is_running() {
    QUEEN_RUNNING=$(docker container inspect -f "{{.State.Running}}" $QUEEN_CONTAINER_NAME)
    if [ "$QUEEN_RUNNING" == 'false' ] ; then
        echo "Queen container has been stopped... stop environment start process..."
        queen_failure
    fi
}

get_token() {
  echo "$(curl -X POST -s "http://$HOSTNAME:1633/auth" -u "_:$1" -d '{"role":"maintainer","expiry":400}' | python -c 'import json,sys; obj=json.load(sys.stdin); print(obj["key"]);')"
}

fetch_queen_underlay_addr() {
    set +e

    if [[ -n "$QUEEN_UNDERLAY_ADDRESS" ]] ; then return; fi
    ELAPSED_TIME=0
    WAITING_TIME=5
    # Wait 2 mins for queen start
    TIMEOUT=$((2*12*WAITING_TIME))
    while (( TIMEOUT > ELAPSED_TIME )) ; do
        check_queen_is_running
        QUEEN_UNDERLAY_ADDRESS=$(curl -s "$HOSTNAME:1633/addresses" | python -mjson.tool | grep "/ip4/" | awk "!/127.0.0.1/" | sed 's/,$//' | xargs)
        if [[ -z "$QUEEN_UNDERLAY_ADDRESS" ]] ; then
            echo "Waiting for the Queen initialization..."
            ELAPSED_TIME=$((ELAPSED_TIME+WAITING_TIME))
            sleep $WAITING_TIME
        else
            echo "Queen underlay address: $QUEEN_UNDERLAY_ADDRESS"
            break;
        fi
    done
    set -e

    if (( TIMEOUT == ELAPSED_TIME )) ; then
        queen_failure
    fi

}

log_queen() {
    trap stop SIGINT
    docker logs --tail 25 -f "$QUEEN_CONTAINER_NAME"
}

count_connected_peers() {
    COUNT=$( (curl -s "http://$HOSTNAME:1633/peers" -H "Authorization: Bearer $1" | python -c 'import json,sys; obj=json.load(sys.stdin); print (len(obj["peers"]));') || echo 0 )

    echo "$COUNT"
}

MY_PATH=$(dirname "$0")              # relative
MY_PATH=$( cd "$MY_PATH" && pwd )  # absolutized and normalized
# Check used system variable set
BEE_VERSION=$("$MY_PATH/utils/build-image-tag.sh" get)
BEE_ENV_PREFIX=$("$MY_PATH/utils/env-variable-value.sh" BEE_ENV_PREFIX)

# Init variables
EPHEMERAL=false
WORKERS=4
LOG=true
RESTRICTED=false
RESTRICTED_PASSWORD=""
QUEEN_CONTAINER_NAME="$BEE_ENV_PREFIX-queen"
WORKER_CONTAINER_NAME="$BEE_ENV_PREFIX-worker"
SWARM_BLOCKCHAIN_NAME="$BEE_ENV_PREFIX-blockchain"
NETWORK="$BEE_ENV_PREFIX-network"
QUEEN_CONTAINER_IN_DOCKER=$(docker container ls -qaf name="$QUEEN_CONTAINER_NAME")
BEE_BASE_IMAGE="ethersphere/bee"
BEE_PASSWORD="password"
QUEEN_BOOTNODE=""
PORT_MAPS=2
SWAP=true
INIT_ROOT_DATA_DIR="$MY_PATH/bee-data-dirs"
HOSTNAME="127.0.0.1"
# TODO: take these from contract-addresses.json
SWAP_FACTORY_ADDRESS="0xCfEB869F69431e42cdB54A4F4f105C19C080A601"
POSTAGE_STAMP_ADDRESS="0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B"
SWAP_PRICE_ORACLE_ADDRESS="0x5b1869D9A4C187F2EAa108f3062412ecf0526b24"
REDISTRIBUTION_ADDRESS="0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7"
STAKING_ADDRESS="0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb"

# Decide script action
case "$1" in
    start)
    shift 1
    ;;
    stop)
    stop
    ;;
    *)
    echoerr "Unknown command: $1"
    usage
    ;;
esac

# Alter variables from flags
while [ $# -gt 0 ]
do
    case "$1" in
        --ephemeral)
        EPHEMERAL=true
        shift 1
        ;;
        --workers=*)
        WORKERS=${1#*=}
        shift 1
        ;;
        --password=*)
        BEE_PASSWORD="${1#*=}"
        shift 1
        ;;
        --version=*)
        BEE_VERSION="${1#*=}"
        shift 1
        ;;
        --hostname=*)
        HOSTNAME="${1#*=}"
        shift 1
        ;;
        --port-maps=*)
        PORT_MAPS="${1#*=}"
        shift 1
        ;;
        --detach)
        LOG=false
        shift 1
        ;;
        --help)
        usage
        ;;
        *)
        echoerr "Unknown argument: $1"
        usage
        ;;
    esac
done

BEE_IMAGE="$BEE_BASE_IMAGE:$BEE_VERSION"

if $EPHEMERAL ; then
    EXTRA_DOCKER_PARAMS="--rm"
fi

# Start Bee Queen
if [ -z "$QUEEN_CONTAINER_IN_DOCKER" ] || $EPHEMERAL ; then
    DOCKER_IMAGE="$BEE_IMAGE"
    EXTRA_QUEEN_PARAMS="-v $INIT_ROOT_DATA_DIR/$QUEEN_CONTAINER_NAME:/home/bee/.bee"
    if [ "$PORT_MAPS" -ge 1 ] ; then
        EXTRA_QUEEN_PARAMS="$EXTRA_QUEEN_PARAMS -p 1633-1634:1633-1634"
    fi

    echo "start Bee Queen process"
    if [ $RESTRICTED == "true" ]; then
      echo "Enabled Restricted API with password: $RESTRICTED_PASSWORD"
    fi
    docker run \
      -d \
      --network="$NETWORK" \
      --name="$QUEEN_CONTAINER_NAME" \
      $EXTRA_DOCKER_PARAMS \
      $EXTRA_QUEEN_PARAMS \
      $DOCKER_IMAGE \
        start \
        --warmup-time=10s \
        --password "$BEE_PASSWORD" \
        --bootnode="$QUEEN_BOOTNODE" \
        --bootnode-mode=false \
        --allow-private-cidrs=true \
        --verbosity=4 \
        --mainnet=false \
        --block-time=5 \
        --api-addr=0.0.0.0:1633 \
        --swap-enable=$SWAP \
        --swap-endpoint="http://$SWARM_BLOCKCHAIN_NAME:9545" \
        --blockchain-rpc-endpoint="http://$SWARM_BLOCKCHAIN_NAME:9545" \
        --swap-factory-address=$SWAP_FACTORY_ADDRESS \
        --postage-stamp-address=$POSTAGE_STAMP_ADDRESS \
        --price-oracle-address=$SWAP_PRICE_ORACLE_ADDRESS \
        --staking-address=$STAKING_ADDRESS \
        --redistribution-address=$REDISTRIBUTION_ADDRESS \
        --network-id 4020 \
        --full-node=true \
        --welcome-message="You have found the queen of the beehive..." \
        --cors-allowed-origins="*" \
        --postage-stamp-start-block=1
else
    docker start "$QUEEN_CONTAINER_IN_DOCKER"
fi

# Start Bee workers
for i in $(seq 1 1 "$WORKERS"); do
    WORKER_NAME="$WORKER_CONTAINER_NAME-$i"
    WORKER_CONTAINER_IN_DOCKER=$(docker container ls -qaf name="$WORKER_NAME")
    if [ -z "$WORKER_CONTAINER_IN_DOCKER" ] || $EPHEMERAL ; then
        # fetch queen underlay address
        fetch_queen_underlay_addr

        # construct additional params
        EXTRA_WORKER_PARAMS=""
        DOCKER_IMAGE="$BEE_IMAGE"
        EXTRA_WORKER_PARAMS="$EXTRA_WORKER_PARAMS -v $INIT_ROOT_DATA_DIR/$WORKER_NAME:/home/bee/.bee"
        if [ $PORT_MAPS -gt $i ] ; then
            PORT_START=$((1633+(10000*i)))
            PORT_END=$((PORT_START + 1))
            EXTRA_WORKER_PARAMS="$EXTRA_WORKER_PARAMS -p $PORT_START-$PORT_END:1633-1634"
        fi

        # run docker container
        echo "start Bee worker $i process"
        docker run \
        -d \
        --network="$NETWORK" \
        --name="$WORKER_NAME" \
        $EXTRA_DOCKER_PARAMS \
        $EXTRA_WORKER_PARAMS \
        $DOCKER_IMAGE \
          start \
          --warmup-time=10s \
          --password "$BEE_PASSWORD" \
          --bootnode="$QUEEN_UNDERLAY_ADDRESS" \
          --allow-private-cidrs=true \
          --verbosity=4 \
          --mainnet=false \
          --block-time=5 \
          --api-addr=0.0.0.0:1633 \
          --swap-enable=$SWAP \
          --swap-endpoint="http://$SWARM_BLOCKCHAIN_NAME:9545" \
          --blockchain-rpc-endpoint="http://$SWARM_BLOCKCHAIN_NAME:9545" \
          --swap-factory-address=$SWAP_FACTORY_ADDRESS \
          --postage-stamp-address=$POSTAGE_STAMP_ADDRESS \
          --price-oracle-address=$SWAP_PRICE_ORACLE_ADDRESS \
          --staking-address=$STAKING_ADDRESS \
          --redistribution-address=$REDISTRIBUTION_ADDRESS \
          --network-id 4020 \
          --full-node=true \
          --welcome-message="I'm just Bee worker ${i} in the beehive." \
          --cors-allowed-origins="*" \
          --postage-stamp-start-block=1
  else
        docker start "$WORKER_CONTAINER_IN_DOCKER"
  fi
done

echo "Check whether the queen node has been connected to every worker..."
ELAPSED_TIME=0
WAITING_TIME=2
TIMEOUT=$((6*30*WAITING_TIME))
RESTRICTED_TOKEN=""
while (( TIMEOUT > ELAPSED_TIME )) ; do
    check_queen_is_running
    if [ $RESTRICTED == "true" ] && [ -z "$RESTRICTED_TOKEN" ]; then
      RESTRICTED_TOKEN=$(get_token "$RESTRICTED_PASSWORD")
      echo "Fetched Bearer token: $RESTRICTED_TOKEN"
    fi;

    COUNT=$(count_connected_peers "$RESTRICTED_TOKEN")
    [[ $COUNT -lt $WORKERS ]] || break
    echo "Only $COUNT peers have been connected to the Queen Bee node yet. Waiting until $WORKERS"
    ELAPSED_TIME=$((ELAPSED_TIME+WAITING_TIME))
    sleep $WAITING_TIME
done
if (( ELAPSED_TIME >= TIMEOUT )) ; then
    queen_failure
fi

# log Bee Queen
if $LOG ; then
    log_queen
fi
