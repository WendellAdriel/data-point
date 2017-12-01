'use strict'

const _ = require('lodash')

/**
 * sets key to value of a copy of target. target stays untouched, if key is
 * an object, then the key will be taken as an object and merged with target
 * @param {Object} target
 * @param {string|Object} key
 * @param {*} value
 */
function set (target, key, value) {
  const obj = {}
  obj[key] = value
  return Object.assign({}, target, obj)
}
module.exports.set = set

function assign (target, toMerge) {
  return Object.assign({}, target, toMerge)
}
module.exports.assign = assign

let uid = 0
function getUID () {
  uid++
  return uid
}
module.exports.getUID = getUID

/**
 * request: https://stackoverflow.com/a/28475765
 * This method has not been tested for performance
 * and could be flawed its only purpose is for error messages
 * @param {*} value
 */
function typeOf (value) {
  return {}.toString
    .call(value)
    .split(' ')[1]
    .slice(0, -1)
    .toLowerCase()
}
module.exports.typeOf = typeOf

function inspect (acc, data) {
  const log = []
  log.push('\n\x1b[33minspect\x1b[0m:', _.get(acc, 'reducer.spec.id'))
  for (let key in data) {
    const value = data[key]
    log.push(`\n${key}:`, _.attempt(JSON.stringify, value, null, 2))
  }

  console.info.apply(null, log)

  if (typeof acc.params.inspect === 'function') {
    console.info('\ncustom:')
    _.attempt(acc.params.inspect, acc)
  }
}
module.exports.inspect = inspect