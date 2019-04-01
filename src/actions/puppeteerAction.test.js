import {invokePuppeteer} from './puppeteerActions';
import propertiesReader from 'properties-reader';
import {
  createMongoConnection,
  saveToDB, fetchwithMongoose
} from '../util/mongooseUtilFunctions';
import customerObj from '../model/customer';
import mongoose from 'mongoose';

const properties = propertiesReader('./properties/config.properties');

test('test for api with puppetter valid scenario'
  , async () => {
    try {
      //first insert an entry to db
      let username = 'dima@litmus7.com';
      let password = 'Aa123456';
      //creating customer object
      let customObj = {
        'scrapeJobId': ''
        , 'status': 'in-progress'
        , 'username': username
        , 'password': password
        , 'orderIds': []
      };
      createMongoConnection(mongoose);
      let dbResponse1 = await saveToDB(customObj, customerObj);
      //expect(1);
      expect(dbResponse1.scrapeJobId.length).toBeGreaterThanOrEqual(1);
      let scrapeJobId = dbResponse1.scrapeJobId;
      customObj.scrapeJobId = scrapeJobId;
      console.log(`scrapeJobId => ${scrapeJobId}`);
      const baseURL = properties.get('walmart-baseurl');
      const targetSelector = properties.get('walmart-orderSection-selector');
      await invokePuppeteer(baseURL, username, password, targetSelector, customObj);
      const data = await fetchwithMongoose(scrapeJobId, customerObj);
      //things to validate are status should be complete, array size
      // should be bigger than 0
      expect(data.status).toEqual('complete');
      
    } catch (err) {
      console.log(`error while invoking puppetteer ${err}`);
    }
  }, 50000);

test('test for api with puppetter invalid credentials'
  , async () => {
    try {
      //first insert an entry to db
      let username = 'dima1@litmus7.com';
      let password = 'Aa123456';
      //creating customer object
      let customObj = {
        'scrapeJobId': ''
        , 'status': 'in-progress'
        , 'username': username
        , 'password': password
        , 'orderIds': []
      };
      createMongoConnection(mongoose);
      let dbResponse1 = await saveToDB(customObj, customerObj);
      //expect(1);
      expect(dbResponse1.scrapeJobId.length).toBeGreaterThanOrEqual(1);
      let scrapeJobId = dbResponse1.scrapeJobId;
      customObj.scrapeJobId = scrapeJobId;
      console.log(`scrapeJobId => ${scrapeJobId}`);
      const baseURL = properties.get('walmart-baseurl');
      const targetSelector = properties.get('walmart-orderSection-selector');
      await invokePuppeteer(baseURL, username, password, targetSelector, customObj);
      const data = await fetchwithMongoose(scrapeJobId, customerObj);
      //things to validate are status should be complete, array size
      // should be bigger than 0
      expect(data.status).toEqual('invalid credentials');
      
    } catch (err) {
      console.log(`error while invoking puppetteer ${err}`);
    }
  }, 50000);
