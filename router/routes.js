const express = require('express');
const route = express.Router();
const controller = require('../controller/puppeteerController')
const PropertiesReader = require('properties-reader');
var validator = require('validator');
var mongocontroller = require('../controller/mongoController')

route.post('/scrapeInfoForUser',(req,resp) => {

    var properties = PropertiesReader('./properties/config.properties');
    var tempScrapeResponseMap = {};
    
    //validate if the necessary parameters are present and not empty
    let hasError = false;

    let baseurl = properties.get("walmart.baseurl");

    let username = req.body.username;
    let password = req.body.password;

    //let username = 'dima@litmus7.com';
    //let password = 'Aa123456';
    var scrapingRepsonse = scrapeInfo = {
        "scrapeJobId": "",
        "status": "",
        "orderIds": []
    };
    if(typeof(username) !== "undefined" && !validator.isEmpty(username) && typeof(password) !== "undefined" &&
            !validator.isEmpty(password) && validator.isEmail(username)){
           
            let targetSelector = properties.get("walmart.orderSection.selector");
            //logic to persist the information in mongo database
            
            var status = "in-progress";
            scrapingRepsonse.status=status;
            scrapingRepsonse.username=username;
            scrapingRepsonse = mongocontroller.persistInformation(scrapingRepsonse,function(scrapingRepsonseTMP){
            console.log('scraping Response---'+JSON.stringify(scrapingRepsonseTMP));
            controller.invokePuppeteer(baseurl,username,password,targetSelector,scrapingRepsonseTMP);
            console.log('puppetter invoked...');
            resp.status(200).send(scrapingRepsonseTMP);
            });    
            
        }else{
            hasError = true;
            resp.status(400).send("Bad Request");
    }
     
});

route.get('/fetchScrapingStatus/:scrapeId',(req,res) => {

    var scrapingRepsonse = scrapeInfo;

    var scrapeId = req.params.scrapeId;
    if(typeof(scrapeId) !== "undefined" && !validator.isEmpty(scrapeId)){
        mongocontroller.fetchInformation(scrapeId,function(data){

            if(typeof(data) !== "undefined" && data !== null){
               if(data.status ==="Invalid Parameter"){
                   res.status(400).send("Bad Request");
               }else{
                res.status(200).send(data);
               }
             
            }else{
                res.status(500).send("API/Service not found");
            }
            

        });

    }else{
        res.status(400).send("Bad Request");
    }

 });




module.exports = route;