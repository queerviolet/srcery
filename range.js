'use strict'
const {Record, Seq} = require('immutable')
    , compile = require('./compile')
    , {literal} = require('.')
    , {promisify} = require('util')
    , {sortedIndexBy} = require('lodash')

class Location {
  constructor({line=1, column=0, offset=0}={}) {
    Object.assign(this, {line, column, offset})
  }

  toString() { return `Location(${JSON.stringify(this)})` }
}

class Range extends Record({
  file: {path: 'unknown.src', content: ''},
  start: new Location(),
  end: new Location(),
}) {
  get src() {
    return this.file.content.slice(
      this.start.offset,
      this.end.offset)
  }

  transform(transformer) {
    return new TransformedRange(this, transformer)
  }

  get asStringLiteral() {
    return this.transform(({src}) => JSON.stringify(src))
  }

  get [literal]() {
    return this.asStringLiteral
  }

  // String facade
  get length() {
    return this.src.length
  }

  charAt(i) {
    return this.src.charAt(i)
  }

  slice(start=0, end=this.length) {    
    const {file} = this    
    if (start < 0) start += this.length
    if (end < 0) end += this.length
    return this.merge({
      file,
      start: file.locationAtOffset(this.start.offset + start),
      end: file.locationAtOffset(this.end.offset + end)
    })
  }

  trim() {
    const s = this.src
        , spaceBefore = s.match(/^\s*/)[0]
        , spaceAfter = s.match(/\s*$/)[0]
    return this.slice(spaceBefore.length, -spaceAfter.length)
  }

  charCodeAt(i) {
    return this.src.charCodeAt(i)
  }

  substring(start, end) {
    return this.slice(start, end)
  }

  [compile]({line, column, map, code}) {
    const {line: originalLine,
           column: originalColumn} = this.start
    const {path: source} = this.file
    map.addMapping({
      source, 
      original: {line: originalLine, column: originalColumn},
      generated: {line, column},
    })
    return this.src [compile] ({line, column, map, code})
  }
}

class File {
  static load(path, {fs=require('fs'), encoding='utf-8'}={}) {
    return promisify(fs.readFile)(path, encoding)
      .then(src => new File(path, src))
  }

  static fromString(content, path) {
    return new File(path, content)
  }

  toString() {
    return `File({path:${this.path}})`
  }

  constructor(path, content) {
    this.path = path
    this.content = content.toString('utf-8')
    this.lines = lines(this)
  }

  get end() {
    const {breaks} = this    
        , {length: l} = breaks
        , last = breaks[l - 1]
        , {length: contentLen} = this.content
    return new Location({
      line: l + 1,
      column: contentLen - last,
      offset: contentLen
    })
  }

  lineAtOffset(offset) {
    const {lines} = this
    return lines[sortedIndexBy(lines,
      {end: {offset}},
      ({end: {offset}}) => offset)]
  }

  locationAtOffset(offset) {
    const line = this.lineAtOffset(offset)
    if (!line) return
    return new Location({
      line: line.start.line,
      column: line.start.column + (offset - line.start.offset),
      offset
    })
  }

  get range() {
    return new Range({
      file: this,
      end: this.end,
    })
  }
}

const nl = '\n'.charCodeAt(0)
function lines(file, str=file.content) {
  const count = str.length
      , lines = []
  let start = new Location()
    , {line, column, offset} = start
    , lastWasNl = false

  function addLine() {
    const end = new Location({
      line, column, offset
    })
    const range = new Range({file, start, end})
    lines.push(range)
    start = new Location({
      line: end.line + 1,
      column: 0,
      offset: offset + 1
    })
    line++
    column = 0
  }

  for (offset = 0; offset != count; ++offset) {
    lastWasNl = false
    if (str.charCodeAt(offset) === nl) {
      lastWasNl = true
      addLine() 
    }
    ++column
  }

  if (!lastWasNl) {
    addLine()
  }

  return lines
}

class TransformedRange {
  constructor(parent, transformer) {
    this.parent = parent
    this.dst = transformer(parent)
  }

  get start() { return this.parent.start }
  get end() { return this.parent.end }
  get file() { return this.parent.file }
  get src() { return this.dst }  

  [compile](state) {
    const {line: originalLine,
           column: originalColumn} = this.start
    const {path: source} = this.file
    const {line, column, map} = state
    map.addMapping({
      source, 
      original: {line: originalLine, column: originalColumn},
      generated: {line, column},
    })
    return this.dst [compile] (state)
  }
}

module.exports = {Location, File, Range}