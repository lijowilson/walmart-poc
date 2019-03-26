require('babel-register')({
    presets: [ 'env' ]
})

// Import the application
require("@babel/polyfill")
require('./server.js')
