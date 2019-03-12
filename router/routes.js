const express = require('express');
const route = express.Router();
const controller = require('../controller/puppeteerController')
const PropertiesReader = require('properties-reader');
var validator = require('validator');
var mongocontroller = require('../controller/mongoController')
var kafkaProducer = require('../controller/kafkaProducerController')

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
        "orderIds": [],
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
            
            /* Commenting for moving to kafka
            controller.invokePuppeteer(baseurl,username,password,targetSelector,scrapingRepsonseTMP);
            console.log('puppetter invoked...');
            resp.status(200).send(scrapingRepsonseTMP);
            
            Code end for moving to kafka*/
            //logic for appending pwd
            
            
            //copy message
            var kafkaMessage = {};
            //recreating the message to be send to kafka
            kafkaMessage.username = username;
            kafkaMessage.password = password;
            kafkaMessage.scrapeJobId = scrapingRepsonseTMP.scrapeJobId;
            kafkaMessage.status = scrapingRepsonseTMP.status;
            kafkaMessage.orderIds = scrapingRepsonseTMP.orderIds;

            console.log('kafkaMEssage'+JSON.stringify(kafkaMessage));
            console.log('scraping responsetmp'+JSON.stringify(scrapingRepsonseTMP))
            kafkaProducer.produceKafkaMessage(kafkaMessage,function(status){
                if(status === "success"){
                    //for sucess scenario
                    resp.status(200).send(scrapingRepsonseTMP);
                }else{
                    //for error scenario
                    scrapingRepsonseTMP.status="error";
                    mongocontroller.persistInformation(scrapingRepsonseTMP,function(callbackResp){
                        console.log('scraping Response---'+JSON.stringify(callbackResp));
                        resp.status(200).send(callbackResp);
                    });            

                }
            });

            });    
            
        }else{
            hasError = true;
            resp.status(400).send("Bad Request");
    }
     
});

route.get('/fetchScrapingStatus/:scrapeId',(req,res) => {

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