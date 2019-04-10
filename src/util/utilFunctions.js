import validator from 'validator';
import {fetchwithMongoose} from '../util/mongooseUtilFunctions';
import customerObj from '../model/customer';
import orderObj from '../model/orders';

export const validateScrapeRequest = (...inputReqArray) => {
  let status = false;
  let [username, password] = inputReqArray;
  if (isNotEmptyAndUndefined(username)
    && isNotEmptyAndUndefined(password)
    && validator.isEmail(username)) {
    status = true;
  }
  return status;
};

export const performFetchInfo = (res, scrapeId) => {
  
  return run();
  
  async function run() {
    try {
      let data = await fetchwithMongoose(scrapeId, customerObj, orderObj);
      if (data !== 'undefined' && data !== null) {
        if (data.status === 'Invalid Parameter') {
          res.status(400).send('Bad Request');
        } else {
          res.status(200).send(data);
        }
      } else {
        res.status(500).send('API/Service not found');
      }
    } catch (err) {
      if (err.message === 'Invalid Parameter') {
        res.status(400).send('Bad Request');
      } else {
        console.log(err);
        res.status(500).send('API/Service not found');
      }
    }
  }
};

export const populateTransferObj = (...inputObj) => {
  
  let kafkaMessage = {};
  let [username, password, scrapejobId, status, orderIds] = inputObj;
  
  if (isNotEmptyAndUndefined(username))
    kafkaMessage.username = username;
  if (isNotEmptyAndUndefined(password))
    kafkaMessage.password = password;
  if (isNotEmptyAndUndefined(scrapejobId))
    kafkaMessage.scrapeJobId = scrapejobId;
  if (isNotEmptyAndUndefined(status))
    kafkaMessage.status = status;
  if (Array.isArray(orderIds))
    kafkaMessage.orderIds = orderIds;
  
  return kafkaMessage;
};

export const isNotEmptyAndUndefined = (input) => {
  return (input !== 'undefined' && !validator.isEmpty(input));
};

export const emptyScrapingResponse = () => {
  let scrapingRepsonseTMP = {
    'scrapeJobId': ''
    , 'status': ''
    , 'orderIds': []
  };
  return scrapingRepsonseTMP;
};

export const emptyFetchInfo = () =>{
  let fetchResponse = {
    'scrapeJobId': ''
    , 'status': ''
    , 'orderInfo': []
  };
  return fetchResponse;
}

export const getLastAccessTime = async (activityTime) => {
  //time in minutes
  console.log(`get last access time currentdate ${new Date()} and activitytime=${activityTime}`);
  return ((new Date() - activityTime)/60000);
  
}