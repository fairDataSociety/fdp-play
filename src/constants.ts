/**
 * for base image that this project build use "fdp-play-blockchain:1.2.0"
 * it will use the latest tag. on image upgrade, either delete the latest locally or force pull
 */
export const DEFAULT_BLOCKCHAIN_IMAGE = 'fairdatasociety/fdp-contracts-blockchain'
export const DEFAULT_BLOCKCHAIN_CONTAINER = 'fdp-play-blockchain'
export const DEFAULT_FAIROS_IMAGE = 'fairdatasociety/fairos-dfs:v0.7.3'
export const ENV_ENV_PREFIX_KEY = 'FDP_PLAY_ENV_PREFIX'
