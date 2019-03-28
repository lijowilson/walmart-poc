import {
  validateScrapeRequest
  , isNotEmptyAndUndefined
  , performFetchInfo
  , populateTransferObj
} from "../util/utilFunctions";
import * as mongoController from "../actions/mongoController";
import * as kafkaController from "../actions/kafkaProducer";

export const pushToKafka = (req, resp) => {
  
  run().catch(err => console.log(err));
  
  async function run() {
    
    //validate if the necessary parameters are present and not empty
    if (req.body) {
      let userObject = req.body
      let username = userObject.username
      let password = userObject.password
      //let username = 'dima@litmus7.com';
      //let password = 'Aa123456';
      let scrapingRepsonse = {
        "scrapeJobId": ""
        , "status": ""
        , "orderIds": []
      }
      if (validateScrapeRequest(username, password)) {
        //logic to persist the information in mongo database
        try {
          
          const status = 'in-progress'
          scrapingRepsonse.status = status
          scrapingRepsonse.username = username
          let scrapingRepsonseTMP = await mongoController.persistInformation(scrapingRepsonse)
          console.log('scraping Response from db---' + JSON.stringify(scrapingRepsonseTMP))
          
          //copy message
          let kafkaMsg = populateTransferObj(username, password, scrapingRepsonseTMP.scrapeJobId,
            scrapingRepsonseTMP.status, scrapingRepsonseTMP.orderIds)
          console.log('kafkaMessage' + JSON.stringify(kafkaMsg))
          console.log('scraping responsetmp' + JSON.stringify(scrapingRepsonseTMP))
          
          //for kafka  produce kafka message
          try {
            await kafkaController.produceKafkaMessage(kafkaMsg)
            resp.status(200).send(scrapingRepsonseTMP)
          } catch (err) {
            //for error scenario
            console.log('erro in kafka', err)
            scrapingRepsonseTMP.status = 'error'
            let callbackResp = await mongoController
              .persistInformation(scrapingRepsonseTMP);
            resp.status(500).send(callbackResp)
            
          }
          
        } catch (err) {
          console.log(err);
          resp.status(500).send('Internal Server Error')
        }
      } else {
        resp.status(400).send('Bad Request')
      }
    }
  }
  
}

export const fetchScrapeStatus = (req, res) => {
  
  let scrapeId = req.params.scrapeId
  if (isNotEmptyAndUndefined(scrapeId)) {
    performFetchInfo(res, scrapeId)
  } else {
    res.status(400).send('Bad Request')
  }
  
}
