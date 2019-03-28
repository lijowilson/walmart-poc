import express from "express"
import bodyParser from 'body-parser'
import router  from "./router/routes"

let app = express()
const APP_PORT = 8080

//for handling static assets especially swaggerui
app.use('/public',express.static('public'))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use('/api',router)
app.listen(APP_PORT,() => {
  console.log('The server is running on port',APP_PORT)
})
