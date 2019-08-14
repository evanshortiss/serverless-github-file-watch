'use strict'

const handler = require('./handler')
const log = require('barelog')

handler.checkForNewCommits(null)
  .then((result) => {
    log('finished', result)
  })
  .catch((err) => {
    log('encountered an error', err)
  })
