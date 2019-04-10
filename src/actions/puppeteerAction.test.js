import mongoose from 'mongoose';
import {invokePuppeteer} from './puppeteerActions';
import propertiesReader from 'properties-reader';
import {
  createMongoConnection,
  fetchwithMongoose,
  saveCustomerInfo
} from '../util/mongooseUtilFunctions';
import customerObj from '../model/customer';
import puppeteer from 'puppeteer';
import {
  initializeLoginPage,
  injectScriptForSession
} from '../util/puppeteerUtilFunctions';

const properties = propertiesReader('./properties/config.properties');

export const populatePuppeteerReq = (username, password, status) => {
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


test('test for initializing puppetteer to get sessionId from login page'
  , async () => {
    try {
      //intialize browser object for puppetter
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
        , headless: true
      });
      //initialize page object
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows; U; Windows NT 5.1; de;' +
        ' rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3 (FM Scene 4.6.1)');
      
      const loginPageURL = properties.get('walmart-loginurl');
      await initializeLoginPage(page, browser, loginPageURL);
      const sessionId = await injectScriptForSession(page, browser);
      expect(sessionId).stringContaining('2a25G2m84Vrp0o9c4');
      
    } catch (err) {
    }
  }, 30000);