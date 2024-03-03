# Changelog

## [3.0.1](https://github.com/fairDataSociety/fdp-play/compare/v3.0.0...v3.0.1) (2024-03-03)


### Bug Fixes

* biggest painpoints ([#111](https://github.com/fairDataSociety/fdp-play/issues/111)) ([62cc552](https://github.com/fairDataSociety/fdp-play/commit/62cc552537b6df40ba35df7b497e4dc0d7064103))

## [3.0.0](https://github.com/fairDataSociety/fdp-play/compare/v2.2.0...v3.0.0) (2023-11-29)


### ⚠ BREAKING CHANGES

* geth blockchain and hardhat ([#105](https://github.com/fairDataSociety/fdp-play/issues/105))

### Features

* bee 1.17.2 ([#97](https://github.com/fairDataSociety/fdp-play/issues/97)) ([1fea708](https://github.com/fairDataSociety/fdp-play/commit/1fea708aa9610d79ba031e7127cf50d8adedee23))
* geth blockchain and hardhat ([#105](https://github.com/fairDataSociety/fdp-play/issues/105)) ([6d6da0b](https://github.com/fairDataSociety/fdp-play/commit/6d6da0b19a9b014bb11b396a8d62c2d65774a0c0))
* phase4 redis ([#102](https://github.com/fairDataSociety/fdp-play/issues/102)) ([c6a6f7f](https://github.com/fairDataSociety/fdp-play/commit/c6a6f7fd94f1f4fe7a53d8003a63cef60aea7a3e))


### Bug Fixes

* byte updates ([a9a01aa](https://github.com/fairDataSociety/fdp-play/commit/a9a01aa6da9ca6435b3964f39ab4d19ddc23cf94))
* contract migration for the new bytecode ([0a6f877](https://github.com/fairDataSociety/fdp-play/commit/0a6f877827ab23baac0e842b726e3d2eaeecd902))
* update contract addresses ([548bc22](https://github.com/fairDataSociety/fdp-play/commit/548bc22d86a7177ba239fb568de3c64d0bc69d0e))
* update contracts bytecode ([1aa9ee2](https://github.com/fairDataSociety/fdp-play/commit/1aa9ee28ed5610da74b8b2b895dafdd553eace7e))

## [2.2.0](https://github.com/fairDataSociety/fdp-play/compare/v2.1.1...v2.2.0) (2023-06-07)


### Features

* eth command ([#73](https://github.com/fairDataSociety/fdp-play/issues/73)) ([0ae40de](https://github.com/fairDataSociety/fdp-play/commit/0ae40de30abfbc4414ee8609c3996dc077e5977a))
* stateful environment script ([#87](https://github.com/fairDataSociety/fdp-play/issues/87)) ([50b2037](https://github.com/fairDataSociety/fdp-play/commit/50b2037e63f695e416dc94d4465dab9a10d2bcb3))


### Bug Fixes

* **generator:** bee worker startup ([b49f172](https://github.com/fairDataSociety/fdp-play/commit/b49f1723ed09835b254e248a67f894250676d467))
* node 18 error ([#92](https://github.com/fairDataSociety/fdp-play/issues/92)) ([6b39a98](https://github.com/fairDataSociety/fdp-play/commit/6b39a98a75a666cd98cda2d73772b3f685a5dbfa))

## [2.1.1](https://github.com/fairDataSociety/fdp-play/compare/v2.1.0...v2.1.1) (2023-02-02)


### Bug Fixes

* starting bee cli params ([#83](https://github.com/fairDataSociety/fdp-play/issues/83)) ([dc9477c](https://github.com/fairDataSociety/fdp-play/commit/dc9477c8873aef20da5f803fe2681ef183647781))

## [2.1.0](https://github.com/fairDataSociety/fdp-play/compare/v2.0.2...v2.1.0) (2023-01-31)


### Features

* update bee and blockchains ([#81](https://github.com/fairDataSociety/fdp-play/issues/81)) ([f840737](https://github.com/fairDataSociety/fdp-play/commit/f840737e4b084fd51749ba848c667043a073d123))

## [2.0.2](https://github.com/fairDataSociety/fdp-play/compare/v2.0.1...v2.0.2) (2022-08-18)


### Bug Fixes

* latest fairos support ([#29](https://github.com/fairDataSociety/fdp-play/issues/29)) ([3bd37e2](https://github.com/fairDataSociety/fdp-play/commit/3bd37e24402207da42e6a847bd4488fba0f8f915))

## [2.0.1](https://github.com/fairDataSociety/fdp-play/compare/v2.0.0...v2.0.1) (2022-07-18)


### Bug Fixes

* pull option ([91228f2](https://github.com/fairDataSociety/fdp-play/commit/91228f2ad2748686143fcaeb1aaf8f0d9437d858))

## [2.0.0](https://github.com/fairDataSociety/fdp-play/compare/v1.0.2...v2.0.0) (2022-07-07)

### Breaking Changes
* From now, the bee version is possible to be defined with the `--bee-version` option instead of passing as an argument.
* Bee versions cannot be defined by package.json or bee-factory.json files.

### Features

* fairos support ([#21](https://github.com/fairDataSociety/fdp-play/issues/21)) ([7556674](https://github.com/fairDataSociety/fdp-play/commit/75566746000a36296fddf3efe737038be39ff25b))
* use latest image for bee containers and pull option ([#18](https://github.com/fairDataSociety/fdp-play/issues/18)) ([077989d](https://github.com/fairDataSociety/fdp-play/commit/077989dfe747cd5d1c10a4cc29b8104315fd3c9b))
* start environment without bees ([#20](https://github.com/fairDataSociety/fdp-play/issues/20)) ([2a36a09](https://github.com/fairDataSociety/fdp-play/commit/2a36a097f1a90294772be2ef9574f890f67566b3))


### Miscellaneous Chores

* release 2.0.0 ([3307ca2](https://github.com/fairDataSociety/fdp-play/commit/3307ca25f61b721122cec856a58bc59f31a4b413))

## [1.0.2](https://github.com/fairDataSociety/fdp-play/compare/v1.0.1...v1.0.2) (2022-06-29)


### Bug Fixes

* pass blockchain image option with version ([#13](https://github.com/fairDataSociety/fdp-play/issues/13)) ([8ddaa71](https://github.com/fairDataSociety/fdp-play/commit/8ddaa710f92c17462e7a16c8a944fac5da588b77))

## [1.0.1](https://github.com/fairDataSociety/fdp-play/compare/v1.0.0...v1.0.1) (2022-06-28)


### Bug Fixes

* package json ([#11](https://github.com/fairDataSociety/fdp-play/issues/11)) ([92bb879](https://github.com/fairDataSociety/fdp-play/commit/92bb879c8de6910f005ee338926b72a7ff74d9a4))

## 1.0.0 (2022-06-28)


### Features

* generator ([#2](https://github.com/fairDataSociety/fdp-play/issues/2)) ([7104e7b](https://github.com/fairDataSociety/fdp-play/commit/7104e7b42b9c4e4ce8e9091e3cead5a571add81d))
* init ([e3168e3](https://github.com/fairDataSociety/fdp-play/commit/e3168e3aba522e3bade8fca84905f8c3c9dc6a59))
* let's roll ([#1](https://github.com/fairDataSociety/fdp-play/issues/1)) ([e18bf88](https://github.com/fairDataSociety/fdp-play/commit/e18bf882fe2c55e97adc9a0069263b26be36ac9e))
