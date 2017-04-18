const path = require('path');

module.exports = {

  entry: './src/client/client.js',

  output: {
    path: './dist',
    filename: 'bundle.js',
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        include: path.join(__dirname, 'src'),
      },
    ],
  },

};
