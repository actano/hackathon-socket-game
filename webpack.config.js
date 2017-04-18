const path = require('path');

module.exports = {

  entry: ['babel-polyfill', './src/client/client.js'],

  output: {
    path: './dist',
    filename: 'bundle.js',
  },

  resolve: {
    extensions: ['', '.js', '.jsx']
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loaders: ['babel'],
        include: path.join(__dirname, 'src'),
      },
    ],
  },

};
