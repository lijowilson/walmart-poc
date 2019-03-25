const express = require('express');
const app = express();

const port = 8080;

//for handling static assets especially swaggerui

app.use('/public',express.static('public'));

//initialize middle ware for handling json
app.use(express.json());
app.use(express.urlencoded({extended:false}));


app.use('/api',require('./router/routes'));
app.listen(port,() => {
    console.log('The server is running on port',port)
});
