/**
 * for base image that this project build use "fdp-play-blockchain:1.2.0"
 * it will use the latest tag. on image upgrade, either delete the latest locally or force pull
 */
export const DEFAULT_BLOCKCHAIN_IMAGE = 'fairdatasociety/fdp-contracts-blockchain'
export const DEFAULT_BLOCKCHAIN_CONTAINER = 'fdp-play-blockchain'
export const DEFAULT_FAIROS_IMAGE = 'fairdatasociety/fairos-dfs'
export const ENV_ENV_PREFIX_KEY = 'FDP_PLAY_ENV_PREFIX'
export const BLOCKCHAIN_RPC_EP = 'http://localhost:9545'
export const BLOCKCHAIN_NETWORK_ID = 4020
