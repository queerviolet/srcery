'use strict'
const {Record, Seq} = require('immutable')
    , {compile} = require('.')
    , {promisify} = require('util')
    , {sortedIndexBy} = require('lodash')

class Location {
  constructor({line=1, column=1, offset=0}={}) {
    Object.assign(this, {line, column, offset})
  }

  toString() { return `Location(${JSON.stringify(this)})` }
}

class File {
  static load(path, {fs=require('fs'), encoding='utf-8'}={}) {
    return promisify(fs.readFile)(path, encoding)
      .then(src => new File(path, src))
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
      column: offset - line.start.offset,
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


class Range extends Record({
  file: new File('unknown.src', ''),
  start: new Location(),
  end: new Location(),
}) {
  get src() {
    return this.file.content.slice(this.start.offset, this.end.offset)
  }

  transform(transformer) {
    return this.update('src', updater)
  }

  get asStringLiteral() {
    return this.update('src', JSON.stringify)
  }

  // String facade
  get length() {
    return this.src.length
  }

  charAt(i) {
    return this.src.charAt(i)
  }

  trim() {
    const s = this.src
        , spaceBefore = s.match(/\s*/)
        , spaceAfter = s.match(/\s*$/)
    return this.slice(spaceBefore.length, -spaceAfter.length)
  }

  charCodeAt(i) {
    return this.src.charCodeAt(i)
  }

  substring(start, end) {
    console.log('substring(%d, %d)', start, end)
    return this.slice(start, end)
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

const nl = '\n'.charCodeAt(0)
function lines(file, str=file.content) {
  const count = str.length
      , lines = []
  let start = new Location()
    , {line, column, offset} = start

  for (let offset = 0; offset != count; ++offset) {
    if (str.charCodeAt(offset) === nl) {
      const end = new Location({
        line, column, offset
      })
      lines.push(new Range({file, start, end}))
      start = new Location({
        line: end.line + 1,
        column: 1,
        offset: offset + 1
      })
      line++
      column = 1  
    }
    ++column
  }

  return lines
}

module.exports = {Location, File, Range}

async function main() {
  const file = await File.load('range.js')
  // for (let line of file.lines) {
  //   const {src, file, start: {line: linum}}  = line
  //   console.log("%s %d %s", file, linum, src)
  // }

  // for (let line of cut(new File('foo', 'hello'))) {
  //   console.log(line)
  // }
  // console.log(file.line(75))

  console.log(file.lines[0])
  console.log('line 1 src "%s"', file.lines[0].src)
  console.log(file.locationAtOffset(100))
  console.log(file.lines[0])
  console.log(file.lines[1])
  console.log('line 3:', file.lines[2].src)
  console.log(file.content.slice(0, 100))
  console.log(file.lineAtOffset(100).src)
  
}

if (module === require.main) main().then(console.log, console.error)