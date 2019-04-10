import puppeteer from 'puppeteer';
import promiseRequest from 'request-promise';
import {fetchSecretInfo, saveSessionId} from '../util/mongooseUtilFunctions';
import {
  getOrderIds, getOrderInfo,
  initializeLoginPage,
  injectScriptForSession
} from '../util/puppeteerUtilFunctions';
import {getLastAccessTime} from '../util/utilFunctions';
import secret from '../model/secret';
import {invokeAPIWithPostman} from '../util/postmanUtilFunctions';
import {persistInformation, persistOrderInfo} from './mongoServices';

/**
 * This method is used to scrape walwmart with API after fetching information
 * from kafka message queue
 *
 * @param baseURL
 * @param username
 * @param password
 * @param loginAPI
 * @param accountAPI
 * @param scpResponseTemp
 * @returns {Promise<*>}
 */
export const scrapeWalmart = async (baseURL,
                                    username,
                                    password,
                                    loginAPI,
                                    accountAPI,
                                    scpResponseTemp) => {
  
  //first retrieve the sessionId to be used for API invocation
  try {
    const sessionId = await getSessionId(baseURL);
    const request = promiseRequest.defaults({jar: true});
    const apiResponse = await invokeAPIWithPostman(baseURL, loginAPI, username
      , password, sessionId, accountAPI, request, scpResponseTemp);
    console.log('API response status code = ' + apiResponse.statusCode);
    if (apiResponse.statusCode === 200) {
      //this means that the account page data is retrieved
      const ordersInfo = apiResponse.orderInfo.orders;
      const orderIdArr = await getOrderIds(ordersInfo);
      scpResponseTemp.orderIds = orderIdArr;
      scpResponseTemp.status = 'complete';
      await persistInformation(scpResponseTemp);
      
      //now saving the data in orders collection
      if (orderIdArr.length > 0) {
        let orderArray = await getOrderInfo(ordersInfo, scpResponseTemp.scrapeJobId);
        await persistOrderInfo(orderArray);
      }
      return scpResponseTemp;
    } else if (apiResponse.statusCode === 403) {
      console.log('Invalid Credentials Entered');
    } else {
      throw new Error('Some Error Occurred while scraping data');
    }
    
  } catch (err) {
    console.log(`error while scraping request => ${err.message} `);
    scpResponseTemp.status = 'error';
    scpResponseTemp.orderIdList = [];
    await persistInformation(scpResponseTemp);
  }
};

/**
 * Gets sessionID from DB collection "secret" or if expired, invokes puppetteer to get
 * the new session of secret.
 * @param baseURL
 * @returns {Promise<string>}
 */
export const getSessionId = async (baseURL) => {
  let sessionId = '';
  try {
    const secretObj = await fetchSecretInfo(1, secret);
    console.log(`getSEessionid secretobj ${secretObj.length}`);
    if (secretObj.length > 0) {
      const tempObj = secretObj[0];
      console.log('if condition');
      //secret is obtained, check if the time is more than 5 min and if so
      //invoke puppetteer to re-validate the secret.
      let ageOfSecret = await getLastAccessTime(tempObj.activationTime);
      console.log(`Age of secret ${ageOfSecret}`);
      if (ageOfSecret > 60) {
        //this means the activity time is expired.So reinitialize the session object
        sessionId = await initPuppeteerForSession(baseURL);
      }
    } else {
      console.log('inside else condition');
      //invoke the puppetteer to update the secret information
      sessionId = await initPuppeteerForSession(baseURL);
    }
    
  } catch (err) {
    console.log(`error while invoking getSessionId => ${err.message}`);
    throw err;
  }
  return sessionId;
};

/**
 * This method is used to invoke puppetteer to renew the session
 * @param baseURL
 * @returns {Promise<*>}
 */
export const initPuppeteerForSession = async (baseURL) => {
  let sessionId = '';
  
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
    await initializeLoginPage(page, browser, baseURL);
    sessionId = await injectScriptForSession(page, browser);
    
    if (sessionId !== '') {
      //persist sessionid info into db
      return await saveSessionId(1, sessionId, secret);
    }
    
  } catch (err) {
    console.log(`error while invoking puppetter to get sessionid ${err.message}`);
    throw err;
  }
  return sessionId;
};
