import {
  validateScrapeRequest
  , isNotEmptyAndUndefined
  , performFetchInfo
  , populateTransferObj
} from '../util/utilFunctions';

import * as mongoController from '../actions/mongoServices';
import * as kafkaController from '../actions/kafkaServices';

export const pushToKafka = (req, resp) => {
  
  run().catch(err => console.log(err));
  
  async function run() {
    
    //validate if the necessary parameters are present and not empty
    if (req.body) {
      const userObject = req.body;
      const username = userObject.username;
      const password = userObject.password;
      //username = 'dima@litmus7.com'; password = 'Aa123456';
      let scrapingRepsonse = {
        "scrapeJobId": ""
        , "status": ""
        , "orderIds": []
      };
      if (validateScrapeRequest(username, password)) {
        //logic to persist the information in mongo database
        try {
          scrapingRepsonse.status = 'in-progress';
          scrapingRepsonse.username = username;
          let scrapingResponseTMP = await mongoController.persistInformation(scrapingRepsonse);
          //copy message
          let kafkaMsg = populateTransferObj(username, password, scrapingResponseTMP.scrapeJobId,
            scrapingResponseTMP.status, scrapingResponseTMP.orderIds);
          //for kafka  produce kafka message
          try {
            await kafkaController.produceKafkaMessage(kafkaMsg);
            resp.status(200).send(scrapingResponseTMP);
          } catch (err) {
            //for error scenario
            console.log(`error in kafka producer flow - ${err}`);
            scrapingResponseTMP.status = 'error';
            let callbackResp = await mongoController.persistInformation(scrapingResponseTMP);
            resp.status(500).send(callbackResp);
          }
        } catch (err) {
          console.log(err);
          resp.status(500).send('Internal Server Error');
        }
      } else {
        resp.status(400).send('Bad Request');
      }
    }
  }
};

export const fetchScrapeStatus = (req, res) => {
  
  // noinspection JSUnresolvedVariable
   const scrapeId = req.params.scrapeId;
  if (isNotEmptyAndUndefined(scrapeId)) {
    return performFetchInfo(res, scrapeId);
  } else {
    res.status(400).send('Bad Request');
  }
};
