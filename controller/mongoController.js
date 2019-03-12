//class level imports for mongodb
var MongoClient  = require('mongodb').MongoClient;
const PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./properties/config.properties');
const ObjectID = require('mongodb').ObjectID;

module.exports = {

    getconnectionURL: function(){

    mongodburl = properties.get('mongodb.connectionURL');
    return mongodburl;
    },

    persistInformation: function(scrapingResponse,callback){

    console.log('Persist Information => scrapeId '+scrapingResponse.scrapeJobId+
    ' username='+scrapingResponse.username+
    ' statusObj'+scrapingResponse.status+
    ' orderIdArr'+scrapingResponse.orderIds);
    connectionURL= this.getconnectionURL();
    mongodbDatabaseName = properties.get('mongodb.databasename');
    collectionName = properties.get('mongodb.collection');
    connectionURL = connectionURL+"/"+mongodbDatabaseName;
  
  
    run().catch(error => console.error(error.stack));  
    async function run() {
         
        const client = await MongoClient.connect(connectionURL, { useNewUrlParser: true } );
        const db = await client.db(mongodbDatabaseName);
        
        if(scrapingResponse.scrapeJobId.length  === 0){
            //this means its first time invokation
            try {
               
                const res = await db.collection(collectionName).insertOne({ 
                    "username": scrapingResponse.username,"status":scrapingResponse.status,"orderIdList":scrapingResponse.orderIds
                });
                scrapingResponse.scrapeJobId = res.insertedId.toString() ;
                var tempScrapeInfo = {
                    "scrapeJobId": "",
                    "status": "",
                    "orderIds": []
                }
                tempScrapeInfo.scrapeJobId = res.insertedId.toString();
                tempScrapeInfo.status = scrapingResponse.status;
                tempScrapeInfo.orderIds = scrapingResponse.orderIds;
                return callback(tempScrapeInfo);     
             }
             finally {
                 client.close();
             }
            
        }
        else{
            //this means its an update of existing data
            try {
                var myquery = { _id:  new ObjectID(scrapingResponse.scrapeJobId) };
                const res = await db.collection(collectionName).updateOne(myquery,{ $set:{ 
                    "status":scrapingResponse.status,
                    "orderIdList":scrapingResponse.orderIds}},
                    { upsert: true },
                    function(err, res) {
                        if (err) throw err;
                        console.log("1 document updated");
                        client.close();
                        var tempScrapeInfo = {
                            "scrapeJobId": "",
                            "status": "",
                            "orderIds": []
                        }
                        tempScrapeInfo.scrapeJobId =scrapingResponse.scrapeJobId;
                        tempScrapeInfo.status = scrapingResponse.status;
                        tempScrapeInfo.orderIds = scrapingResponse.orderIds;                    
                        return callback(tempScrapeInfo);
                      });
            
              
             }catch(err){
                 console.log(err);
             }
             finally {
                 client.close();
             }

        }
      
      
    }

    },
    fetchInformation : function(scrapingJobId,callback){
        //This function is used to fetch the information associated to the scrapejobid
    connectionURL= this.getconnectionURL();
    mongodbDatabaseName = properties.get('mongodb.databasename');
    collectionName = properties.get('mongodb.collection');
    connectionURL = connectionURL+"/"+mongodbDatabaseName;
    var tempScrapeInfoFetch = {
        "scrapeJobId": "",
        "status": "",
        "orderIds": []
    };
    var scrapingJobIdTemp = scrapingJobId;

    run().catch(error => console.error(error.stack));  
    async function run() {
        const client = await MongoClient.connect(connectionURL, { useNewUrlParser: true } );
        const db = await client.db(mongodbDatabaseName);
        try {
            var filterQuery =  { _id:  new ObjectID(scrapingJobId) };


            const res = await db.collection(collectionName).findOne(filterQuery,function(err, result) {
                if (err) {
                    //throw err;
                    tempScrapeInfoFetch.status = "error";
                }else{
                    if(result != null){
                        tempScrapeInfoFetch.status = result.status;
                        tempScrapeInfoFetch.orderIds = result.orderIdList;
                        tempScrapeInfoFetch.scrapeJobId = scrapingJobIdTemp;
                    }else{
                        tempScrapeInfoFetch.status = "Invalid Parameter";
                    }
                }
                console.log('result ->'+result);
                console.log('returned response = '+tempScrapeInfoFetch);

                callback(tempScrapeInfoFetch);
             
              });
           
                 
         }catch(err){
            console.log(err);
            tempScrapeInfo.status ="Invalid Parameter"
            callback(tempScrapeInfoFetch);    
         }
         finally {
             client.close();
         }

        }
        
    }
      
  };