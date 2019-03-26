//What is the best approach for babel. Is it to use .babelrc or use a seperate file

require('babel-register')({
    presets: [ 'env' ]
})

// Import the application
require("@babel/polyfill")
require('./server.js')
