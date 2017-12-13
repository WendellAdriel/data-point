/* eslint-env jest */
'use strict'

const coreFactory = require('./factory')

const reducers = require('../../test/utils/reducers')
const entities = require('../../test/definitions/entities')

const transform = require('./transform')
const TestData = require('../../test/data.json')
const nock = require('nock')

let dataPoint

beforeAll(() => {
  dataPoint = coreFactory.create({
    values: {
      v1: 'v1'
    },
    reducers: {
      test: reducers
    },
    entities
  })
})

test('transform - throw error in invalid id(promise)', () => {
  return transform(dataPoint, 'INVALID', TestData, {})
    .catch(err => err)
    .then(res => {
      expect(res).toBeInstanceOf(Error)
      expect(res).toMatchSnapshot()
    })
})

test('transform - single reducer', () => {
  const reducer = (acc, next) => {
    next(null, acc.value + ' World')
  }
  return transform(dataPoint, reducer, 'Hello').then(res => {
    expect(res.value).toEqual('Hello World')
  })
})

test('transform - reducer chain', () => {
  const reducers = [
    (acc, next) => {
      next(null, acc.value + ' World')
    },
    (acc, next) => {
      next(null, acc.value + '!!')
    }
  ]
  return transform(dataPoint, reducers, 'Hello').then(res => {
    expect(res.value).toEqual('Hello World!!')
  })
})

test('transform - reducer path', () => {
  return transform(dataPoint, '$a.b.c', TestData).then(res => {
    expect(res.value).toEqual([1, 2, 3])
  })
})

test('transform - reducer mixed', () => {
  const getMax = (acc, next) => {
    next(null, Math.max.apply(null, acc.value))
  }
  return transform(dataPoint, ['$a.b.c', getMax], TestData).then(res => {
    expect(res.value).toEqual(3)
  })
})

describe('options argument', () => {
  test('passing locals', () => {
    const reducer = (acc, next) => {
      next(null, acc.locals.greeting + ' World')
    }

    const options = {
      locals: {
        greeting: 'Hello'
      }
    }

    return transform(dataPoint, reducer, {}, options).then(res => {
      expect(res.value).toEqual('Hello World')
    })
  })
})

describe('handle undefined value', () => {
  test('transform - should pass undefined', () => {
    return transform(dataPoint, '$a.b.c').then(res => {
      expect(res.value).toEqual(undefined)
    })
  })

  test('transform - should pass undefined', () => {
    return transform(dataPoint, 'hash:noValue')
      .catch(e => e)
      .then(res => {
        expect(res).toBeInstanceOf(Error)
      })
  })

  test('transform - request should execute as it does not depend on value passed', () => {
    nock('http://remote.test')
      .get('/source1')
      .reply(200, {
        ok: true
      })
    return transform(dataPoint, 'request:a1')
      .catch(e => e)
      .then(res => {
        expect(res.value).toEqual({
          ok: true
        })
      })
  })
})
