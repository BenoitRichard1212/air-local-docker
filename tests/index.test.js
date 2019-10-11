const test = require('ava')

test.beforeEach(t => {
  t.context.data = ''
})

test('index commands', t => {
  t.is(t.context.data, '')
})
