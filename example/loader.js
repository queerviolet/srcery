const {src, Map} = require('..')

// const c = src `${Map(`throw new Error`, {line: 128, column: 256, source: 'abc.foo'})}`

// console.log(c)

// console.log(c.compile().gen.toString())

module.exports = function () {  
  const {code, map} = src `${
    Map(`process.nextTick(() => {throw new Error})`,
    {line: 2, column: 256, source: 'abc.foo'})}`.compile()
  
  this.callback(null, code, map.toString())
}