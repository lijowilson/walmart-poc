import {emptyScrapingResponse} from './utilFunctions';
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

export const fetchwithMongoose = async (scrapeJobId, scrapeboard) => {
  let tempScrapeInfoFetch = emptyScrapingResponse();
  try {
    const result = await scrapeboard.findById(scrapeJobId);
    if (result != null) {
      tempScrapeInfoFetch.status = result.status;
      tempScrapeInfoFetch.orderIds = result.orderIdList;
      tempScrapeInfoFetch.scrapeJobId = scrapeJobId;
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

export const saveToDB = async (scrapingResponse, customer) => {
  
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
      let myQuery = {_id: scrapingResponse.scrapeJobId};
      await customer.findOneAndUpdate(
        myQuery
        , {
          $set: {
            'status': scrapingResponse.status,
            'orderIdList': scrapingResponse.orderIds
          }
        }, {
          upsert: true
        });
      
      console.log(`1 document updated`);
      let tempScrapeInfo = emptyScrapingResponse();
      tempScrapeInfo.scrapeJobId = scrapingResponse.scrapeJobId;
      tempScrapeInfo.status = scrapingResponse.status;
      tempScrapeInfo.orderIds = scrapingResponse.orderIds;
      
      return tempScrapeInfo;
    } catch (err) {
      console.log(`error while updating information -> ${err}`);
      if (err) throw err
    }
  }
  
};
