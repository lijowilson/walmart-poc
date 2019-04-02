import {fetchwithMongoose, saveToDB} from './mongooseUtilFunctions';
import propertiesReader from 'properties-reader';

import mongoose from 'mongoose';
import {createMongoConnection} from './mongooseUtilFunctions';
import customerObj from '../model/customer';

const properties = propertiesReader('./properties/config.properties');

beforeAll(() => {
  //starting mongoose connection
  createMongoConnection(mongoose);
});

describe('testing the fetch API', () => {
  test('test whether we are able to sucessfully search for a product for fetch API'
    , async () => {
      
      const positiveFetchId = properties.get('jest-fetch-complete-id');
      const data = await fetchwithMongoose(positiveFetchId, customerObj);
      //things to validate are status should be complete, array size
      // should be bigger than 0
      expect(data.status).toEqual('complete');
      //validate if orderids array is bigger than 0
      expect(data.orderIds.length).toBeGreaterThanOrEqual(1);
    });
  
  test('test whether we are able to sucessfully search for a product for fetch API' +
    ' with invalid credentials'
    , async () => {
      
      const invalidId = properties.get('jest-fetch-invalidCredential-id');
      const data = await fetchwithMongoose(invalidId, customerObj);
      //things to validate are status should be invalid & array size be '0'
      expect(data.status).toEqual('invalid credentials');
      //validate if orderids array is of size 0
      expect(data.orderIds.length).toBeLessThan(1);
    });
  
  test('test fetch API with huge object Id'
    , async () => {
      try {
        const hugeFetchId = '5c9e4b0b4d7183416cc1a33f33333rrff';
        await fetchwithMongoose(hugeFetchId, customerObj);
      } catch (err) {
        //console.log(`err.message object => ${err.message}`);
        expect(err.message).toEqual('Invalid Parameter');
      }
      
    });
});

describe('testing the save API of mongoose', () => {
  test('test save API for mongoose for new user positive scenario'
    , async () => {
      try {
        //creating customer object
        let scrapingObject = {
          'scrapeJobId': ''
          , 'status': 'test-status'
          , 'username': 'test-user@gmail.com'
          , 'orderIds': []
        };
        const dbResponse = await saveToDB(scrapingObject, customerObj);
        expect(dbResponse.scrapeJobId.length).toBeGreaterThanOrEqual(1);
        expect(dbResponse.status).toEqual('test-status');
      } catch (err) {
        console.log(`err.message object => ${err.message}`);
      }
      
    });
  
  test('test save API for mongoose for new user with empty userrname'
    , async () => {
      try {
        //creating customer object
        let scrapingObject = {
          'scrapeJobId': ''
          , 'status': 'test-status'
          , 'username': ''
          , 'orderIds': []
        };
        await saveToDB(scrapingObject, customerObj);
        
      } catch (err) {
        //console.log(`err.message object => ${err.message}`);
        expect(err.message)
          .toEqual(expect.stringContaining('customer validation failed'));
      }
      
    });
  
  test('test save API for mongoose for new user with empty status'
    , async () => {
      try {
        //creating customer object
        let scrapingObject = {
          'scrapeJobId': ''
          , 'status': ''
          , 'username': 'test-user@gmail.com'
          , 'orderIds': []
        };
        await saveToDB(scrapingObject, customerObj);
        
      } catch (err) {
        //console.log(`err.message object => ${err.message}`);
        expect(err.message)
          .toEqual(expect.stringContaining('customer validation failed'));
      }
      
    });
  
  test('test save API for mongoose for new user with username bigger' +
    ' than 20 characters'
    , async () => {
      try {
        //creating customer object
        let scrapingObject = {
          'scrapeJobId': ''
          , 'status': 'test-status'
          , 'username': 'test-user-longuser@gmail.com'
          , 'orderIds': []
        };
        await saveToDB(scrapingObject, customerObj);
        
      } catch (err) {
        //console.log(`err.message object => ${err.message}`);
        expect(err.message)
          .toEqual(expect.stringContaining('is longer than the maximum allowed length '));
      }
      
    });
  
  
  test('test save API for mongoose for existing user'
    , async () => {
      
      //creating customer object
      let customObj = {
        'scrapeJobId': ''
        , 'status': 'test-status'
        , 'username': 'test-update@t.com'
        , 'orderIds': []
      };
      const dbResponse = await saveToDB(customObj, customerObj);
      //now run the update
      customObj.scrapeJobId = dbResponse.scrapeJobId;
      customObj.status = 'test-update';
      customObj.username = 'test-update@t.com';
      customObj.orderIds = ['122222', '2222222', '311111'];
      
      //console.log(`scraping object before save ${ JSON.stringify(customObj)}`)
      let updatedResponse = await saveToDB(customObj, customerObj);
      expect(updatedResponse.status).toEqual('test-update');
      expect(updatedResponse.orderIds.length).toBeGreaterThanOrEqual(3);
      
      
    });
});


