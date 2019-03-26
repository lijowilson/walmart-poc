import express from 'express'
import propertiesReader from 'properties-reader'
import validator from 'validator'
import * as mongoController from '../controller/mongoController'
import * as kafkaController from "../controller/kafkaProducerController"

let router = express.Router()

router.post('/scrapeInfoForUser', (req, resp) => {
  
  run().catch(err => console.log(err));
  
  async function run() {
    
    let properties = propertiesReader('./properties/config.properties')
    //validate if the necessary parameters are present and not empty
    
    let username = req.body.username
    let password = req.body.password
    //let username = 'dima@litmus7.com';
    //let password = 'Aa123456';
    let scrapingRepsonse = {
      "scrapeJobId": ""
      , "status": ""
      , "orderIds": []
    }
    
    if (typeof (username) !== "undefined" && !validator.isEmpty(username)
      && typeof (password) !== "undefined" &&
      !validator.isEmpty(password) && validator.isEmail(username)) {
      
      //logic to persist the information in mongo database
      
      try {
  
        let status = "in-progress"
        scrapingRepsonse.status = status
        scrapingRepsonse.username = username
        let scrapingRepsonseTMP = await mongoController.persistInformation(scrapingRepsonse)
  
        console.log('scraping Response from db---' + JSON.stringify(scrapingRepsonseTMP))
  
        //copy message
        let kafkaMessage = {}
        //recreating the message to be send to kafka
        kafkaMessage.username = username
        kafkaMessage.password = password
        kafkaMessage.scrapeJobId = scrapingRepsonseTMP.scrapeJobId
        kafkaMessage.status = scrapingRepsonseTMP.status
        kafkaMessage.orderIds = scrapingRepsonseTMP.orderIds
  
        console.log('kafkaMEssage' + JSON.stringify(kafkaMessage))
        console.log('scraping responsetmp' + JSON.stringify(scrapingRepsonseTMP))
  
        //for kafka  produce kafka message
        let kafkaStatus = await kafkaController.produceKafkaMessage(kafkaMessage)
        if (kafkaStatus === "success") {
          //for sucess scenario
          resp.status(200).send(scrapingRepsonseTMP)
        } else {
          //for error scenario
          scrapingRepsonseTMP.status = "error"
          let callbackResp = await mongoController.persistInformation(scrapingRepsonseTMP);
          if (callbackResp) {
            console.log('scraping Response---' + JSON.stringify(callbackResp))
            resp.status(200).send(callbackResp)
          }
    
        }
      }catch(err){
        console.log(err);
      }
    } else {
      resp.status(400).send("Bad Request")
    }
    
  }
})

router.get('/fetchScrapingStatus/:scrapeId', (req, res) => {
  
  async function fetchFromMongo() {
    let scrapeId = req.params.scrapeId
    if (typeof (scrapeId) !== "undefined" && !validator.isEmpty(scrapeId)) {
      try {
        let data = await mongoController.fetchInformation(scrapeId)
        if (typeof (data) !== "undefined" && data !== null) {
          if (data.status === "Invalid Parameter") {
            res.status(400).send("Bad Request")
          } else {
            res.status(200).send(data)
          }
        } else {
          res.status(500).send("API/Service not found")
        }
      } catch (err) {
        if (err === "Invalid Parameter") {
          res.status(400).send("Bad Request")
        } else {
          console.log(err);
          res.status(500).send("API/Service not found")
        }
        
      }
      
    } else {
      res.status(400).send("Bad Request")
    }
    
  }
  
  fetchFromMongo().catch(err => {
    console.log(err);
  })
})

export default router
