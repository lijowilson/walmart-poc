require('babel-register')({
    presets: [ 'env' ]
})

// Import the application
require('@babel/polyfill')
require('./controller/kafkaConsumerController')
