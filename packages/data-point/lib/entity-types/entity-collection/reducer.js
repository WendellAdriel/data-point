'use strict'

const Util = require('util')
const Promise = require('bluebird')
const utils = require('../../utils')

function resolveMapTransform (accumulator, transform, resolveTransform) {
  if (transform.reducers.length === 0) {
    return Promise.resolve(accumulator)
  }
  return Promise.map(accumulator.value, itemValue => {
    const itemContext = utils.set(accumulator, 'value', itemValue)
    return resolveTransform(itemContext, transform).then(res => {
      return res.value
    })
  })
    .then(result => utils.set(accumulator, 'value', result))
    .catch(err => {
      err.message = `Entity: ${accumulator.reducer.spec.id}.map ${err.message}`
      throw err
    })
}

function resolveFilterTransform (accumulator, transform, resolveTransform) {
  if (transform.reducers.length === 0) {
    return Promise.resolve(accumulator)
  }
  return Promise.filter(accumulator.value, itemValue => {
    const itemContext = utils.set(accumulator, 'value', itemValue)
    return resolveTransform(itemContext, transform).then(res => {
      return !!res.value
    })
  })
    .then(result => utils.set(accumulator, 'value', result))
    .catch(err => {
      err.message = `Entity: ${accumulator.reducer.spec.id}.filter ${
        err.message
      }`
      throw err
    })
}

function resolveFindTransform (accumulator, transform, resolveTransform) {
  if (transform.reducers.length === 0) {
    return Promise.resolve(accumulator)
  }
  return Promise.reduce(
    accumulator.value,
    (result, itemValue) => {
      const itemContext = utils.set(accumulator, 'value', itemValue)
      return (
        result ||
        resolveTransform(itemContext, transform).then(res => {
          return res.value ? itemValue : undefined
        })
      )
    },
    null
  )
    .then(result => utils.set(accumulator, 'value', result))
    .catch(err => {
      err.message = `Entity: ${accumulator.reducer.spec.id}.find ${err.message}`
      throw err
    })
}

const modifierFunctionMap = {
  map: resolveMapTransform,
  find: resolveFindTransform,
  filter: resolveFilterTransform
}

function resolveCompose (accumulator, composeModifiers, resolveTransform) {
  if (composeModifiers.length === 0) {
    return Promise.resolve(accumulator)
  }

  return Promise.reduce(
    composeModifiers,
    (resultContext, modifierSpec) => {
      const modifierFunction = modifierFunctionMap[modifierSpec.type]
      return modifierFunction(
        resultContext,
        modifierSpec.transform,
        resolveTransform
      )
    },
    accumulator
  )
}

// NOTE: as expensive as this might be, this is to avoid 'surprises'
function validateAsArray (acc) {
  const entity = acc.reducer.spec
  return acc.value instanceof Array
    ? acc
    : Promise.reject(
      new Error(
        Util.format(
          `"%s" received acc.value = %s of type %s this entity only process Array values. More info %s`,
          entity.id,
          Util.inspect(acc.value).substr(0, 15),
          utils.typeOf(acc.value),
          'https://github.com/ViacomInc/data-point/tree/master/packages/data-point#collection-entity'
        )
      )
    )
}

function resolve (accumulator, resolveTransform) {
  const entity = accumulator.reducer.spec

  // // if there is nothing to do, lets just move on
  // if (_.isEmpty(accumulator.value)) {
  //   return Promise.resolve(accumulator)
  // }

  return resolveTransform(accumulator, entity.value, resolveTransform)
    .then(acc => validateAsArray(acc))
    .then(acc => resolveCompose(acc, entity.compose, resolveTransform))
}

module.exports.resolve = resolve
