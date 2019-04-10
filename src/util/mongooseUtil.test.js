import mongoose from 'mongoose';
import {
  createMongoConnection,
  fetchwithMongoose,
  saveCustomerInfo,
  deleteFromDB,
  saveOrdersToDB,
  fetchSecretInfo,
  saveSessionId
} from './mongooseUtilFunctions';
import propertiesReader from 'properties-reader';
import customerObj from '../model/customer';
import orderObj from '../model/orders';
import secretObj from '../model/secret'

const properties = propertiesReader('./properties/config.properties');
let scrapeIdArr = [];
let orderIdArr = [];
let secretIdArr = [];

beforeAll(() => {
  //starting mongoose connection
  createMongoConnection(mongoose);
});

describe('testing the fetch API', () => {
  test('test whether we are able to sucessfully search for a product for fetch API'
    , async () => {
      
      const positiveFetchId = properties.get('jest-fetch-complete-id');
      const data = await fetchwithMongoose(positiveFetchId, customerObj, orderObj);
      //things to validate are status should be complete, array size
      // should be bigger than 0
      expect(data.status).toEqual('complete');
      //validate if orderids array is bigger than 0
      expect(data.orderInfo.length).toBeGreaterThanOrEqual(1);
    });
  
  test('test whether we are able to sucessfully search for a product for fetch API' +
    ' with invalid credentials'
    , async () => {
      
      const invalidId = properties.get('jest-fetch-invalidCredential-id');
      const data = await fetchwithMongoose(invalidId, customerObj, orderObj);
      //things to validate are status should be invalid & array size be '0'
      expect(data.status).toEqual('Invalid Credentials');
      //validate if orderids array is of size 0
      expect(data.orderInfo.length).toBeLessThan(1);
    });
  
  test('test fetch API with huge object Id'
    , async () => {
      try {
        const hugeFetchId = '5c9e4b0b4d7183416cc1a33f33333rrff';
        await fetchwithMongoose(hugeFetchId, customerObj, orderObj);
      } catch (err) {
        //console.log(`err.message object => ${err.message}`);
        expect(err.message).toEqual('Invalid Parameter');
      }
      
    });
  
  test('test fetch API for secret positive scenario'
    , async () => {
      try {
        const secretId = properties.get('jest-fetch-secret-id');
        const secretInfo = await fetchSecretInfo(secretId, secretObj);
        expect(secretInfo.length).toBeGreaterThanOrEqual(1);
      } catch (err) {
        console.log(`err.message object => ${err.message}`);
      }
      
    });
  
  test('test fetch API for secret negative scenario'
    , async () => {
      try {
        const secretId = 100;
        const secretInfo = await fetchSecretInfo(secretId, secretObj);
        //ideally the object should be empty as the secret key is invalid
        expect(secretInfo.length).toBeLessThanOrEqual(0);
      } catch (err) {
        console.log(`err.message object => ${err.message}`);
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
          , 'orderInfo': []
        };
        let orderObjectArr = [];
        let orderObject = {
          'customerId': '',
          'orderId': '',
          'productList': []
        };
        const dbResponse = await saveCustomerInfo(scrapingObject, customerObj);
        expect(dbResponse.scrapeJobId.length).toBeGreaterThanOrEqual(1);
        expect(dbResponse.status).toEqual('test-status');
        
        //saving orders collection
        scrapeIdArr.push(dbResponse.scrapeJobId);
        orderObject.customerId = dbResponse.scrapeJobId;
        orderObject.orderId = '1234';
        
        const productListArray = [];
        productListArray.push('test product1');
        productListArray.push('test product2');
        
        orderObject.productList = productListArray;
        orderObjectArr.push(orderObject);
        const orderResponse = await saveOrdersToDB(orderObjectArr, orderObj);
        
        if (orderResponse.id.length > 0) {
          orderIdArr.push(orderResponse.id);
        }
        
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
        await saveCustomerInfo(scrapingObject, customerObj);
        
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
        await saveCustomerInfo(scrapingObject, customerObj);
        
      } catch (err) {
        //console.log(`err.message object => ${err.message}`);
        expect(err.message)
          .toEqual(expect.stringContaining('customer validation failed'));
      }
      
    });
  
  test('test save API for mongoose for new user with username bigger' +
    ' than 30 characters'
    , async () => {
      try {
        //creating customer object
        let scrapingObject = {
          'scrapeJobId': ''
          , 'status': 'test-status'
          , 'username': 'test-user-longuser1234567@gmail.com'
          , 'orderIds': []
        };
        await saveCustomerInfo(scrapingObject, customerObj);
        
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
      const dbResponse = await saveCustomerInfo(customObj, customerObj);
      //now run the update
      customObj.scrapeJobId = dbResponse.scrapeJobId;
      customObj.status = 'test-update';
      customObj.username = 'test-update@t.com';
      customObj.orderIds = ['122222', '2222222', '311111'];
      
      //console.log(`scraping object before save ${ JSON.stringify(customObj)}`)
      let updatedResponse = await saveCustomerInfo(customObj, customerObj);
      expect(updatedResponse.status).toEqual('test-update');
      expect(updatedResponse.orderIds.length).toBeGreaterThanOrEqual(3);
      scrapeIdArr.push(dbResponse.scrapeJobId);
      
    });
  
  test('test the secret info save API'
    , async () => {
      //creating secret object
      const tempId = 2;
      const secretKey = '121212121212121212121221212121212';
      await saveSessionId(tempId, secretKey, secretObj);
      
      //to validate if the data is persisted
      const secretInfo = await fetchSecretInfo(tempId, secretObj);
      //ideally the object should be empty as the secret key is invalid
      expect(secretInfo.length).toBeGreaterThanOrEqual(1);
      if (secretInfo.length > 0) {
        let tempObj = secretInfo[0];
        let secretObjId = tempObj.id;
        secretIdArr.push(secretObjId);
      }
    });
});

afterAll(() => {
  if (scrapeIdArr.length > 0) {
    for (let tempId of scrapeIdArr) {
      deleteFromDB(tempId, customerObj)
    }
  }
  
  if (orderIdArr.length > 0) {
    for (let tempOrderId of orderIdArr) {
      deleteFromDB(tempOrderId, orderObj);
    }
  }
  
  if (secretIdArr.length > 0) {
    for (let secretId of secretIdArr) {
      deleteFromDB(secretId, secretObj);
    }
  }
  
});


