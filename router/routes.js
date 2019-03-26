import express from 'express'
import propertiesReader from 'properties-reader'
import validator from 'validator'
import * as mongoController from '../controller/mongoController'
import * as kafkaController from "../controller/kafkaProducerController"

let router = express.Router()

router.post('/scrapeInfoForUser', (req, resp) => {
  
  let properties = propertiesReader('./properties/config.properties')
  //validate if the necessary parameters are present and not empty
  let hasError = false
  
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
    
    let status = "in-progress"
    scrapingRepsonse.status = status
    scrapingRepsonse.username = username
    scrapingRepsonse = mongoController.persistInformation(scrapingRepsonse
      ,scrapingRepsonseTMP => {
        console.log('scraping Response---' + JSON.stringify(scrapingRepsonseTMP))
        
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
        kafkaController.produceKafkaMessage(kafkaMessage, status => {
          if (status === "success") {
            //for sucess scenario
            resp.status(200).send (scrapingRepsonseTMP)
          } else {
            //for error scenario
            scrapingRepsonseTMP.status = "error"
            mongoController.persistInformation(scrapingRepsonseTMP
              ,callbackResp => {
                console.log('scraping Response---' + JSON.stringify(callbackResp))
                resp.status(200).send (callbackResp)
              })
            
          }
        })
        
      })
    
  } else {
    hasError = true
    resp.status(400).send("Bad Request")
  }
  
})

router.get('/fetchScrapingStatus/:scrapeId', (req, res) => {
  
  var scrapeId = req.params.scrapeId
  if (typeof (scrapeId) !== "undefined" && !validator.isEmpty(scrapeId)) {
    
    mongoController.fetchInformation(scrapeId, data => {
      
      if (typeof (data) !== "undefined" && data !== null) {
        if (data.status === "Invalid Parameter") {
          res.status(400).send("Bad Request")
        } else {
          res.status(200).send(data)
        }
        
      } else {
        res.status(500).send("API/Service not found")
      }
      
      
    })
    
  } else {
    res.status(400).send("Bad Request")
  }
  
})


export default router