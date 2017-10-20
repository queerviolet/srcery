module.exports = {
  entry: './index.foo',
  output: {
    filename: 'bundle.js',
    publicPath: '/assets/',    
  },
  devtool: 'inline-source-map',
  module: {
    rules: [{
      test: /foo$/,
      use: './loader'
    }]
  },
}