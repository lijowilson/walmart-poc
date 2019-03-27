import "babel-polyfill"
import express from "express"
import router  from "./router/routes"
let app = express()
const APP_PORT = 8080

//for handling static assets especially swaggerui
app.use('/public',express.static('public'))

//initialize middle ware for handling json
app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.use('/api',router)
app.listen(APP_PORT,() => {
  console.log('The server is running on port',APP_PORT)
})
