const dataPoint = require('../').create()

const isArray = () => acc => {
  if (acc.value instanceof Array) {
    // if the value is valid, then just pass it along
    return acc.value
  }

  // notice how we pass this Error object as the FIRST parameter,
  // this tells DataPoint there was an error, and treat it as such.
  throw new Error(`${acc.value} should be an Array`)
}

dataPoint.addEntities({
  'entry:foo': {
    // points to a NON Array value
    value: '$a',
    after: isArray(),
    error: acc => {
      console.log('Value is invalid, resolving to empty array')
      // passing a a value as the second argument
      // will stop the propagation of the error
      return []
    }
  }
})

const input = {
  a: {
    b: [3, 15, 6, 3, 8]
  }
}

dataPoint.transform('entry:foo', input).then(acc => {
  console.log(acc.value)
  // Value is invalid, resolving to empty array
  // []
})
