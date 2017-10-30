module.exports = compile

function compile(target, ...args) {
  return target [compile] (...args)
}

const sym = Symbol('compile')

compile [Symbol.toPrimitive] = function() {
  return sym
}

/*** Base implementations for [compile] ***/

String.prototype [compile] = function({line, column, map, code}) {
  const count = this.length
  for (let i = 0; i != count; ++i) {
    const c = this[i]
    ++column; if (c === '\n') ++line
    code += c
  }
  return {line, column, map, code}  
}

Array.prototype [compile] = function(state) {
  const {length} = this
  for (let i = 0; i != length; ++i) {
    state = this[i] [compile] (state)
  }
  return state
}

Number.prototype [compile] = function(state) {
  return JSON.stringify(this) [compile] (state)
}