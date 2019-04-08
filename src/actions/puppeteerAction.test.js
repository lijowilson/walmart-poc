import {invokePuppeteer} from './puppeteerActions';
import propertiesReader from 'properties-reader';
import {
  createMongoConnection,
  fetchwithMongoose,
  saveCustomerInfo
} from '../util/mongooseUtilFunctions';
import customerObj from '../model/customer';
import mongoose from 'mongoose';

const properties = propertiesReader('./properties/config.properties');
export const populatePuppeteerReq = (username, password,status) => {
  //creating customer object
  return {
    'scrapeJobId': ''
    , 'status': status
    , 'username': username
    , 'password': password
    , 'orderIds': []
  };
};
beforeAll(() => {
  //starting mongoose connection
  createMongoConnection(mongoose);
});


test.skip('test for api with puppetter valid scenario'
  , async () => {
    try {
      const username = 'dima@litmus7.com';
      const password = 'Aa123456';
      let customObj = populatePuppeteerReq(username, password, 'in-progress');
      createMongoConnection(mongoose);
      let dbResponse1 = await saveCustomerInfo(customObj, customerObj);
      //expect(1);
      expect(dbResponse1.scrapeJobId.length).toBeGreaterThanOrEqual(1);
      let scrapeJobId = dbResponse1.scrapeJobId;
      customObj.scrapeJobId = scrapeJobId;
      console.log(`scrapeJobId => ${scrapeJobId}`);
      const baseURL = properties.get('walmart-baseurl');
      const apiURL = properties.get('walmart-apiurl');
      await invokePuppeteer(baseURL, username, password, apiURL, customObj);
      const data = await fetchwithMongoose(scrapeJobId, customerObj);
      expect(data.status).toEqual('complete');
      
    } catch (err) {
      console.log(`error while invoking puppetteer ${err}`);
    }
  }, 50000);

test.skip('test for api with puppetter invalid credentials'
  , async () => {
    try {
      const username = 'dima1@litmus7.com';
      const password = 'Aa123456';
      let customObj = populatePuppeteerReq(username, password, 'in-progress');
      createMongoConnection(mongoose);
      let dbResponse1 = await saveCustomerInfo(customObj, customerObj);
      //expect(1);
      expect(dbResponse1.scrapeJobId.length).toBeGreaterThanOrEqual(1);
      let scrapeJobId = dbResponse1.scrapeJobId;
      customObj.scrapeJobId = scrapeJobId;
      console.log(`scrapeJobId => ${scrapeJobId}`);
      const baseURL = properties.get('walmart-baseurl');
      const apiURL = properties.get('walmart-apiurl');
      await invokePuppeteer(baseURL, username, password, apiURL, customObj);
      const data = await fetchwithMongoose(scrapeJobId, customerObj);
      expect(data.status).toEqual('invalid credentials');
      
    } catch (err) {
      console.log(`error while invoking puppetteer ${err}`);
    }
  }, 50000);

