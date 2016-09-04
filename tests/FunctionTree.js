'use strict'

const FunctionTree = require('../src')

module.exports['should create a function tree extending event emitter'] = (test) => {
  const execute = FunctionTree([])

  test.equal(typeof execute.on, 'function')
  test.equal(typeof execute.once, 'function')
  test.equal(typeof execute.off, 'function')
  test.done()
}

module.exports['should run functions'] = (test) => {
  const execute = FunctionTree()

  test.expect(1)
  execute([
    function action() {
      test.ok(true)
    }
  ])
  test.done()
}

module.exports['should pass arguments to context creator and run it for each action'] = (test) => {
  const execute = FunctionTree([
    function SomeProvider(context, functionDetails, payload) {
      test.ok(context)
      test.equal(functionDetails.functionIndex, 0)
      test.deepEqual(payload, {foo: 'bar'})
    }
  ])

  test.expect(3)
  execute([
    function action() {}
  ], {
    foo: 'bar'
  })
  test.done()
}

module.exports['should pass returned context into functions'] = (test) => {
  const execute = FunctionTree([
    function SomeProvider() {
      return {
        foo: 'bar'
      }
    }
  ])

  test.expect(1)
  execute([
    function action(context) {
      test.deepEqual(context, {foo: 'bar'})
    }
  ])
  test.done()
}

module.exports['should emit execution events in correct order'] = (test) => {
  let eventsCount = 0
  const execute = FunctionTree()

  test.expect(6)
  execute.once('start', function() {
    eventsCount++
    test.equal(eventsCount, 1)
  })
  execute.once('functionStart', function() {
    eventsCount++
    test.equal(eventsCount, 2)
    execute.once('functionStart', function() {
      eventsCount++
      test.equal(eventsCount, 4)
    })
  })
  execute.once('functionEnd', function() {
    eventsCount++
    test.equal(eventsCount, 3)
    execute.once('functionEnd', function() {
      eventsCount++
      test.equal(eventsCount, 5)
    })
  })
  execute.on('end', function() {
    eventsCount++
    test.equal(eventsCount, 6)
    test.done()
  })
  execute([
    function actionA() {},
    function actionB() {}
  ])
}

module.exports['should pass action and payload on action events'] = (test) => {
  const execute = FunctionTree()

  test.expect(4)
  execute.once('functionStart', function(functionDetails, payload) {
    test.equal(functionDetails.functionIndex, 0)
    test.deepEqual(payload, {foo: 'bar'})
  })
  execute.once('functionEnd', function(functionDetails, payload) {
    test.equal(functionDetails.functionIndex, 0)
    test.deepEqual(payload, {foo: 'bar'})
  })
  execute([
    function action() {}
  ], {
    foo: 'bar'
  })
  test.done()
}

module.exports['should be able to reuse existing chain to define signals'] = (test) => {
  function actionA() {
    test.ok(true)
    return {
      path: 'success'
    }
  }

  function actionB() {
    test.ok(true)
    return {
      path: 'success'
    }
  }

  function actionC() {
    test.ok(true)
  }

  const execute = FunctionTree([])
  const tree = [
    actionA, {
      success: [
        actionB, {
          success: [
            actionC
          ]
        }
      ]
    }
  ]
  test.expect(6)
  execute(tree, () => {
    execute(tree, () => {
      test.done()
    })
  })
}