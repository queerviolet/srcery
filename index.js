'use strict'

const {SourceMapGenerator} = require('source-map')

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

function Map(src, location) {
  return new MappedPiece(src, location)
}

function compile(target, ...args) {
  return target [compile] (...args)
}
const compileSymbol = Symbol('compile')
compile [Symbol.toPrimitive] = function() {
  return compileSymbol
}

class Piece {
  constructor(pieces) {
    this.pieces = pieces
  }

  compile(map=new SourceMapGenerator()) {
    const count = this.pieces.length
    let state = {
      line: 1,
      column: 1,
      map,      
      code: '',
    }
    for (let i = 0; i != count; ++i) {
      state = this.pieces[i] [compile] (state)
    }
    return state
  }

  [compile](state) {
    return this.compile(state)
  }
}

class MappedPiece {
  constructor(src, location) {
    this.src = src
    this.location = location
  }

  [compile]({line, column, map, code}) {
    const {source,
           line: originalLine,
           column: originalColumn} = this.location
    map.addMapping({
      source, 
      original: {line: originalLine, column: originalColumn},
      generated: {line, column},
    })    
    return this.src [compile] ({line, column, map, code})
  }
}

String.prototype [compile] = function({line, column, map, code}) {
  const count = this.length
  for (let i = 0; i != count; ++i) {
    const c = this[i]
    ++column; if (c === '\n') ++line
    code += c
  }
  return {line, column, map, code}  
}

module.exports = {src, Map, compile}
