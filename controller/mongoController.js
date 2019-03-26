//class level imports for mongodb
import * as mongodb from 'mongodb'
import propertiesReader from 'properties-reader'

let properties = propertiesReader('./properties/config.properties')
const ObjectID = mongodb.ObjectID
let mongoClient = mongodb.MongoClient


export function getConnectionURL () {
  
  let mongodburl = properties.get('mongodb-connectionURL')
  return mongodburl
}

export function persistInformation (scrapingResponse, callback) {
  
  console.log('Persist Information => scrapeId ' + scrapingResponse.scrapeJobId +
    ' username=' + scrapingResponse.username +
    ' statusObj' + scrapingResponse.status +
    ' orderIdArr' + scrapingResponse.orderIds)
  let connectionURL = this.getConnectionURL()
  let mongodbDatabaseName = properties.get('mongodb-databasename')
  let collectionName = properties.get('mongodb-collection')
  connectionURL = connectionURL + "/" + mongodbDatabaseName
  
  
  run().catch (error => console.error(error.stack))
  
  async function run () {
    
    const client = await mongoClient.connect(connectionURL
      ,{useNewUrlParser: true})
    const db = await client.db(mongodbDatabaseName)
    
    if (scrapingResponse.scrapeJobId.length === 0) {
      //this means its first time invokation
      try {
        
        const res = await db.collection(collectionName).insertOne({
          "username": scrapingResponse.username
          , "status": scrapingResponse.status
          , "orderIdList": scrapingResponse.orderIds
        })
        scrapingResponse.scrapeJobId = res.insertedId.toString()
        let tempScrapeInfo = {
          "scrapeJobId": ""
          , "status": ""
          , "orderIds": []
        }
        tempScrapeInfo.scrapeJobId = res.insertedId.toString()
        tempScrapeInfo.status = scrapingResponse.status
        tempScrapeInfo.orderIds = scrapingResponse.orderIds
        return callback(tempScrapeInfo)
      } finally {
        client.close()
      }
      
    } else {
      //this means its an update of existing data
      try {
        let myquery = {_id: new ObjectID(scrapingResponse.scrapeJobId)}
        const res = await db.collection(collectionName).updateOne(myquery, {
            $set: {
              "status": scrapingResponse.status,
              "orderIdList": scrapingResponse.orderIds
            }
          }
          , {upsert: true},
          function (err, res) {
            if (err) throw err
            console.log("1 document updated")
            client.close()
            let tempScrapeInfo = {
              "scrapeJobId": ""
              , "status": ""
              , "orderIds": []
            }
            tempScrapeInfo.scrapeJobId = scrapingResponse.scrapeJobId
            tempScrapeInfo.status = scrapingResponse.status
            tempScrapeInfo.orderIds = scrapingResponse.orderIds
            return callback(tempScrapeInfo)
          })
        
        
      } catch (err) {
        console.log(err)
      } finally {
        client.close()
      }
      
    }
    
    
  }
  
}

export function fetchInformation (scrapingJobId, callback) {
  //This function is used to fetch the information associated to the scrapejobid
  console.log('inside fetchinformation')
  let connectionURL = this.getConnectionURL()
  let mongodbDatabaseName = properties.get('mongodb-databasename')
  let collectionName = properties.get('mongodb-collection')
  connectionURL = connectionURL + "/" + mongodbDatabaseName
  let tempScrapeInfoFetch = {
    "scrapeJobId": ""
    , "status": ""
    , "orderIds": []
  }
  let scrapingJobIdTemp = scrapingJobId
  
  run().catch (error => console.error(error.stack))
  
  async function run () {
    const client = await mongoClient.connect(connectionURL
      ,{useNewUrlParser: true})
    const db = await client.db(mongodbDatabaseName)
    try {
      let filterQuery = {_id: new ObjectID(scrapingJobId)}
      
      
      const res = await db.collection(collectionName).findOne(filterQuery
        , function (err, result) {
          if (err) {
            //throw err;
            tempScrapeInfoFetch.status = "error"
          } else {
            if (result != null) {
              tempScrapeInfoFetch.status = result.status
              tempScrapeInfoFetch.orderIds = result.orderIdList
              tempScrapeInfoFetch.scrapeJobId = scrapingJobIdTemp
            } else {
              tempScrapeInfoFetch.status = "Invalid Parameter"
            }
          }
          console.log('result ->' + result)
          console.log('returned response = ' + tempScrapeInfoFetch)
          
          callback(tempScrapeInfoFetch)
          
        })
      
      
    } catch (err) {
      console.log(err)
      tempScrapeInfoFetch.status = "Invalid Parameter"
      callback(tempScrapeInfoFetch)
    } finally {
      client.close()
    }
    
  }
  
}

