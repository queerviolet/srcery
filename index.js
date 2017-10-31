'use strict'

const {SourceMapGenerator} = require('source-map')
    , compile = require('./compile')

function src (raw, ...args) {
  const pieces = []
      , count = raw.length
  for(let i = 0; i != count; ++i) {
    pieces.push(raw[i])
    if (typeof args[i] !== 'undefined')
      pieces.push(args[i])
  }
  return new Piece(pieces)
}

class Piece {
  constructor(pieces) {
    this.pieces = pieces
  }

  compile(map=new SourceMapGenerator()) {
    let state = {
      line: 1,
      column: 1,
      map,      
      code: '',
    }
    console.log('compile=', compile[Symbol.toPrimitive]())// 'compile[toPrimitive]=', compile[Symbol.toPrimitive]())
    return this[compile](state)
  }

  [compile](state) {
    return this.pieces[compile](state)
  }
}

function literal(target) {
  return target [literal]
}
const literalSymbol = Symbol('literal')
literal [Symbol.toPrimitive] = function() {
  return literalSymbol
}

Object.defineProperty(String.prototype, literal, {
  get() {
    return JSON.stringify(this)
  }
})

Object.defineProperty(Array.prototype, literal, {
  get() {
    return [
      '[',
      ...this.reduce((all, one) => (all.push(one, ','), all), []),
      ']'
    ]
  }
})


module.exports = src
