import {emptyScrapingResponse} from './utilFunctions'
import propertiesReader from 'properties-reader'

let properties = propertiesReader('./properties/config.properties')

export const createMongoConnection = (mongoose) => {
  let connectionURL = getConnectionURL()
  let mongodbDatabaseName = properties.get('mongodb-databasename')
  connectionURL = connectionURL + "/" + mongodbDatabaseName
  
  mongoose.connect(connectionURL, {useNewUrlParser: true}, err => {
      if (!err) {
        console.log('mongoose connection suceeded');
      } else {
        console.log('Error connecting to db', err);
      }
    }
  );
}


export function getConnectionURL() {
  
  let mongodburl = properties.get('mongodb-connectionURL')
  return mongodburl
}


export const fetchwithMongoose = async (scrapeJobId, scrapeboard) => {
  let tempScrapeInfoFetch = emptyScrapingResponse()
  try {
    const result = await scrapeboard.findById(scrapeJobId)
    if (result != null) {
      tempScrapeInfoFetch.status = result.status;
      tempScrapeInfoFetch.orderIds = result.orderIdList;
      tempScrapeInfoFetch.scrapeJobId = scrapeJobId;
    } else {
      tempScrapeInfoFetch.status = "Invalid Parameter";
    }
    
  } catch (err) {
    tempScrapeInfoFetch.status = "error";
    if (err.message.indexOf('Cast to ObjectId failed') !== -1) {
      console.log('invalid parameter error')
      throw new Error('Invalid Parameter')
    } else {
      throw err
    }
    console.log('error while fetching information from mongodb', err)
  }
  return tempScrapeInfoFetch
}

export const saveToDB = async (scrapingResponse, scrapeboard) => {
  
  /* now the save operation for scraping resposne can take 2 options. Either the scraping response
     which scrape id is empty which means its the first time invokation else
     scrape id would not be empty whih means it would be an updation
  */
  
  if (scrapingResponse.scrapeJobId.length === 0) {
    let scrapeBoradObj = new scrapeboard({
      "username": scrapingResponse.username,
      "status": scrapingResponse.status
      , "orderIdList": scrapingResponse.orderIds
    });
    
    //run the validation
    let errorValidator = scrapeBoradObj.validateSync();
    if (typeof errorValidator !== 'undefined') {
      //this means error present. Dont save
      console.log('error  in validator', errorValidator.errors)
      throw errorValidator.errors;
    } else {
      try {
        
        let newScrapeBoard = await scrapeBoradObj.save()
        // saved!
        let tempScrapeInfo = emptyScrapingResponse()
        tempScrapeInfo.scrapeJobId = newScrapeBoard.id
        tempScrapeInfo.status = newScrapeBoard.status
        tempScrapeInfo.orderIds = newScrapeBoard.orderIdList
        
        return tempScrapeInfo
      } catch (err) {
        if (err) throw (err);
        
      }
      
    }
    //if( assert.ok(!errorValidator.errors['username']) && assert.ok(!errorValidator.errors['status'])){
  } else {
    try {
      let myquery = {_id: scrapingResponse.scrapeJobId}
      let res = await scrapeboard.findOneAndUpdate(
        myquery
        , {
          $set: {
            "status": scrapingResponse.status,
            "orderIdList": scrapingResponse.orderIds
          }
        }, {
          upsert: true
        });
      
      console.log("1 document updated")
      let tempScrapeInfo = emptyScrapingResponse()
      tempScrapeInfo.scrapeJobId = scrapingResponse.scrapeJobId
      tempScrapeInfo.status = scrapingResponse.status
      tempScrapeInfo.orderIds = scrapingResponse.orderIds
      return tempScrapeInfo
      
    } catch (err) {
      console.log('error while updating information', err)
      if (err) throw err
    }
  }
  
}
