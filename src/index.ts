#!/usr/bin/env node
import './shim/crypto'
import { cli } from 'furious-commander'
import { application } from './application'
import { optionParameters, rootCommandClasses } from './config'
import { printer } from './printer'
import { errorHandler } from './utils/error'

cli({
  rootCommandClasses,
  optionParameters,
  printer,
  application,
  errorHandler,
})
