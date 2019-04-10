import propertiesReader from 'properties-reader';
import {getSessionId} from '../actions/postmanServices';
import promiseRequest from 'request-promise';
import {invokeLogin, invokeOrderAPI} from './postmanUtilFunctions';
import {createMongoConnection} from './mongooseUtilFunctions';
import mongoose from 'mongoose';
const properties = propertiesReader('./properties/config.properties');

beforeAll(() => {
  //starting mongoose connection
  createMongoConnection(mongoose);
});

describe('testing the Postman Login API', () => {
  test('test whether we are able to sucessfully Login with postman request with valid sessionId'
    , async () => {
      
      const loginPageURL = properties.get('walmart-loginurl');
      const loginAPI = properties.get('walmart-signinapi-url');
      const username = 'lijo.k.wilson@gmail.com';
      const password = 'test1234';
      //fetch the latest sessionId from secret assuming the secret is not very old
      const sessionId = await getSessionId(loginPageURL);
      const request = promiseRequest.defaults({jar: true});
      const loginResponse = await invokeLogin(loginAPI, username, password, sessionId, request);
    
      expect(loginResponse.statusCode).toEqual(200);
     
    });
  
  test('test if we are denied login to Postman with invalid credentials'
    , async () => {
    
      const loginPageURL = properties.get('walmart-loginurl');
      const loginAPI = properties.get('walmart-signinapi-url');
      const username = 'lijo.k.wilson123@gmail.com';
      const password = 'test1234';
      //fetch the latest sessionId from secret assuming the secret is not very old
      const sessionId = await getSessionId(loginPageURL);
      const request = promiseRequest.defaults({jar: true});
      let statusCode='';
      try {
       await invokeLogin(loginAPI, username, password, sessionId, request);
      }catch(err){
        if(err.message === 'Invalid Credentials Entered'){
          statusCode = 403;
        }
      }
      expect(statusCode).toEqual(403);
      
    });
  
  
  //412
  test('test whether we are able to not login with unauthorized secret'
    , async () => {
      
      const loginPageURL = properties.get('walmart-loginurl');
      const loginAPI = properties.get('walmart-signinapi-url');
      const username = 'lijo.k.wilson123@gmail.com';
      const password = 'test1234';
      //fetch the latest sessionId from secret assuming the secret is not very old
      const sessionId = 'sdfasdfasdfasdfasdfasdfasdfsdsadf'; //dummy sessionId
      const request = promiseRequest.defaults({jar: true});
      const loginResponse = await invokeLogin(loginAPI, username, password, sessionId, request);
     
      expect(loginResponse.statusCode).toEqual(412);
    });
  
});

describe('testing the Postman for order API', () => {
  test('test to check if we are able to get orderInformation after invokign login api'
    , async () => {
      try {
        const loginPageURL = properties.get('walmart-loginurl');
        const loginAPI = properties.get('walmart-signinapi-url');
        const accountAPI = properties.get('walmart-apiurl');
        const username = 'lijo.k.wilson@gmail.com';
        const password = 'test1234';
        //fetch the latest sessionId from secret assuming the secret is not very old
        const sessionId = await getSessionId(loginPageURL);
        const request = promiseRequest.defaults({jar: true});
        await invokeLogin(loginAPI, username, password, sessionId, request);
        const orderResponse = await invokeOrderAPI(accountAPI, promiseRequest);
        expect(orderResponse.statusCode).toEqual(200);
        
      } catch (err) {
        console.log(`err.message object for invoking order API=> ${err.message}`);
      
      }
    });
});

