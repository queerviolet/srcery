const {src, literal} = require('..')
    , {File} = require('../range')

const compile = file => {
  console.log('file.lines=', file.lines.length)
  return src(file.lines.map(
    (line, linum) => line.transform(line => src `
      window.line${linum} = () => {
        ${
            line.transform(
              line => src `throw new Error(${line [literal]})`
            )
        }
      }`
    )   
  )).compile()
}

module.exports = function (content) {  
  const {code, map} = compile(File
    .fromString(content, this.resourcePath))
  
  map.setSourceContent(this.resourcePath, content)

  this.callback(null, code, map.toString())
}