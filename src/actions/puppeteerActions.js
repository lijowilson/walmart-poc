import puppeteer from 'puppeteer';
import {persistInformation} from './mongoServices';
import {
  openBasePage,
  executeLogin,
  invalidLoginFlow,
  invokeAcctPageAPI
} from '../util/puppeteerUtilFunctions'

export const invokePuppeteer = async (baseURL, username, password, apiURL,
                                      scpResponseTemp) => {
  
  //open browser object
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
    , headless: true
  });
  //open page object
  const page = await browser.newPage();
  try {
    //open the page with base url
    await openBasePage(browser, page, baseURL, scpResponseTemp);
    //execute login info
    await executeLogin(page, username, password);
    await Promise.race([
      page.waitForNavigation(),
      page.waitForSelector('#global-error > .button-link')
    ]);
    if (await page.$('#global-error > .button-link')) {
      // there was an error on login flow
      await invalidLoginFlow(browser, scpResponseTemp, persistInformation);
    } else {
      //inovoke the account api
      await invokeAcctPageAPI(page, scpResponseTemp, browser, apiURL);
    }
  } catch (err) {
    console.log(`error in puppetteer actions js ${err.message}`);
    browser.close();
    if(err.message !== 'Invalid Credentials Entered'){
      scpResponseTemp.status = 'error';
      scpResponseTemp.orderIdList = [];
      await persistInformation(scpResponseTemp);
    }
    return err;
  }
}
