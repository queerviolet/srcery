const {Record, Seq} = require('immutable')
    , {compile} = require('.')
    , {promisify} = require('util')

const Location = Record({
  line: 1,
  column: 1,
  offset: 0,
})

class File {
  static load(path, {fs=require('fs'), encoding='utf-8'}={}) {
    return promisify(fs.readFile)(path, encoding)
      .then(src => new File(path, src))
  }

  constructor(path, content) {
    this.path = path
    this.content = content.toString('utf-8')
    this.breaks = lineBreaks(content)
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

  get range() {
    return new Range({
      file: this,
      end: this.end,
    })
  }

  get count() {
    const value = this.breaks.length + 1
    Object.defineProperty(this, 'count', {value})    
    return value
  }

  line(line) {
    const {breaks} = this
    if (line < 0 || line > breaks.length) return    
    const endBreak = breaks[line] || {
      offset: this.content.length,
      lineLength: this.content.length
    }
    const startBreak = breaks[line - 1] || {
      offset: -1,
    }
    
    const start = startBreak.offset + 1
        , end = endBreak.offset
    return new Range({
      start: new Location({
        line: line + 1,
        column: 1,
        offset: start
      }),
      end: new Location({
        line: line + 1,
        column: endBreak.lineLength,
        offset: end
      }),
      src: this.content.slice(start, end)
    })
  }

  get lines() {
    return Seq(lines(this))
  }
}

function *lines(file) {  
  for (let i = 0; i != file.count; ++i)
    yield file.line(i)
}


class Range extends Record({
  file: new File('unknown.src', ''),
  start: Location(),
  end: Location(),
  src: '',
}) {
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
function lineBreaks(str) {
  const count = str.length;
  const breaks = []
  let lastBreak = 0
  for (let i = 0; i != count; ++i) {
    if (str.charCodeAt(i) === nl) {      
      breaks.push({
        offset: i,
        lineLength: i - lastBreak
      })
      lastBreak = i
    }
  }
  return breaks
}

module.exports = {File, Range}

async function main() {
  const file = await File.load('range.js')
  for (let {src, start: {line: linum}} of file.lines) {
    console.log("%d %s", linum, src)
  }

  // for (let line of cut(new File('foo', 'hello'))) {
  //   console.log(line)
  // }
  console.log(file.line(75))
}

if (module === require.main) main()