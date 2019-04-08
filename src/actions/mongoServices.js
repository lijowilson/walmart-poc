//class level imports for mongodb
import {saveCustomerInfo, saveOrdersToDB} from '../util/mongooseUtilFunctions';
import customerObj from '../model/customer';
import orderObj from '../model/orders';

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
  
  return saveCustomerInfo(scrapingResponse, customerObj);
}

export function persistOrderInfo(orderResponse) {
  return saveOrdersToDB(orderResponse, orderObj);
}
