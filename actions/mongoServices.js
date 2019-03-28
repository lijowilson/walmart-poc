//class level imports for mongodb
import { saveToDB} from "../util/mongooseUtilFunctions";
import scrapeboard from '../model/scrapeboard'

/**
 * This method is used to persist information in mongodb
 * @param scrapingResponse
 *
 */
export function persistInformation(scrapingResponse) {
  
  console.log('Persist Information => scrapeId=' + scrapingResponse.scrapeJobId +
    ',username=' + scrapingResponse.username +
    ',statusObj=' + scrapingResponse.status +
    ',orderIdArr=' + scrapingResponse.orderIds)
  
  return  saveToDB(scrapingResponse, scrapeboard);
}

/**
 * This function is used to fetch the information from mongodb with input params
 * @param scrapingJobId
 */
export function fetchInformation(scrapingJobId) {
  //This function is used to fetch the information associated to the scrapejobid
  console.log('inside fetchinformation scrapingJobId=',scrapingJobId)
  return fetchwithMongoose(scrapingJobId,scrapeboard)
  
}

