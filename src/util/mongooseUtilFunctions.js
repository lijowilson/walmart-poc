import {
  emptyScrapingResponse,
  emptyFetchInfo,
  isNotEmptyAndUndefined
} from './utilFunctions';
import propertiesReader from 'properties-reader';

const properties = propertiesReader('./properties/config.properties');

export const createMongoConnection = (mongoose) => {
  
  const mongodbDatabaseName = properties.get('mongodb-databasename');
  const connectionURL = getConnectionURL() + '/' + mongodbDatabaseName;
  
  mongoose.connect(connectionURL, {useNewUrlParser: true}, err => {
      if (!err) {
        console.log(`mongoose connection succeeded`);
      } else {
        console.log('Error connecting to db', err);
      }
    }
  );
};

export function getConnectionURL() {
  return properties.get('mongodb-connectionURL');
}

export const fetchwithMongoose = async (scrapeJobId, customerObj, orderObj) => {
  let tempScrapeInfoFetch = emptyFetchInfo();
  try {
    const result = await customerObj.findById(scrapeJobId);
    if (result != null) {
      tempScrapeInfoFetch.status = result.status;
      tempScrapeInfoFetch.scrapeJobId = scrapeJobId;
      //logic to retrieve order and product information
      tempScrapeInfoFetch.orderInfo = await getOrderInformation(orderObj, scrapeJobId);//customerid
    } else {
      tempScrapeInfoFetch.status = 'Invalid Parameter';
    }
  } catch (err) {
    tempScrapeInfoFetch.status = 'error';
    console.log(`error while fetching information from mongodb => ${err}`);
    if (err.message.indexOf('Cast to ObjectId failed') !== -1) {
      console.log(`invalid parameter error`);
      throw new Error('Invalid Parameter');
    } else {
      throw err;
    }
  }
  return tempScrapeInfoFetch
};

export const saveCustomerInfo = async (scrapingResponse, customer) => {
  
  /* now the save operation for scraping response can take 2 options. Either the scraping response
     which scrape id is empty which means its the first time invocation else
     scrape id would not be empty which means it would be an update
  */
  
  if (scrapingResponse.scrapeJobId.length === 0) {
    let customerObj = new customer({
      'username': scrapingResponse.username
      , 'status': scrapingResponse.status
      , 'orderIdList': scrapingResponse.orderIds
    });
    
    try {
      const newScrapeBoard = await customerObj.save();
      // saved!
      let tempScrapeInfo = emptyScrapingResponse();
      tempScrapeInfo.scrapeJobId = newScrapeBoard.id;
      tempScrapeInfo.status = newScrapeBoard.status;
      tempScrapeInfo.orderIds = newScrapeBoard.orderIdList;
      
      return tempScrapeInfo;
    } catch (err) {
      if (err) throw (err);
    }
  }
  //if( assert.ok(!errorValidator.errors['username']) && assert.ok(!errorValidator.errors['status'])){
  else {
    try {
      const myQuery = {_id: scrapingResponse.scrapeJobId};
      const respObj = await customer.findOneAndUpdate(
        myQuery
        , {
          $set: {
            'status': scrapingResponse.status,
            'orderIdList': scrapingResponse.orderIds
          }
        }, {
          upsert: true,
          new: true
        });
      
      console.log(`1 document updated`);
      let tempScrapeInfo = emptyScrapingResponse();
      tempScrapeInfo.scrapeJobId = respObj.id;
      tempScrapeInfo.status = respObj.status;
      tempScrapeInfo.orderIds = respObj.orderIdList;
      
      return tempScrapeInfo;
    } catch (err) {
      console.log(`error while updating information -> ${err}`);
      if (err) throw err
    }
  }
  
};

export const deleteFromDB = async (scrapeId, customer) => {
  if (isNotEmptyAndUndefined(scrapeId)) {
    const deleteQuery = {_id: scrapeId};
    try {
      await customer.remove(deleteQuery);
    } catch (err) {
      console.error(`Error in delete From DB ${err}`);
    }
  }
};

export const saveOrdersToDB = async (orderObjArr, orderModel) => {
  
  let orderResponse = {
    id : ''
  };
  for (let order of orderObjArr) {
    let orderObj = new orderModel({
      'customerId': order.customerId
      , 'orderId': order.orderId
      , 'productList': order.productList
    });
    
    try {
      const orderModel = await orderObj.save();
      orderResponse.id = orderModel.id;
    } catch (err) {
      if (err) throw (err);
    }
  }
  return orderResponse;
};

export const getOrderInformation = async (orderObj, customerId) => {
  
  const orderInfo = [];
  try {
    const orderData = await orderObj.find({customerId: customerId});
    if (typeof orderData !== 'undefined') {
      orderData.forEach(function (orderItem) {
        let orderAray = {};
        orderAray.orderId = orderItem.orderId;
        orderAray.productList = orderItem.productList;
        orderInfo.push(orderAray);
      });
    }
  } catch (err) {
    console.log(`error while fetching order information ${err.message}`);
    throw err;
  }
  return orderInfo;
};
