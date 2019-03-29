//class level imports for mongodb
import {saveToDB} from '../util/mongooseUtilFunctions';
import customerObj from '../model/customer';

/**
 * This method is used to persist information in mongodb
 * @param scrapingResponse
 *
 */
export function persistInformation(scrapingResponse) {
  
  console.log(`Persist Information =>
      scrapeId=${scrapingResponse.scrapeJobId}
      ,username=${scrapingResponse.username}
      ,statusObj=${scrapingResponse.status}
      ,orderIdArr=${scrapingResponse.orderIds}`);
  
  return saveToDB(scrapingResponse, customerObj);
}
