import puppeteer from 'puppeteer';
import {persistInformation} from './mongoServices';
import {
  openBasePage,
  executeLogin,
  invalidLoginFlow,
  traverseAccountPage
} from '../util/puppeteerUtilFunctions'

export const invokePuppeteer = async(baseURL, username, password, targetSelectors,
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
      await executeLogin(page, username, password, targetSelectors);
      await Promise.race([
        page.waitForSelector('.' + targetSelectors),
        page.waitForSelector('#global-error > .button-link')
      ]);
      if (await page.$('#global-error > .button-link')) {
        // there was an error on login flow
        try {
          await invalidLoginFlow(browser, scpResponseTemp, persistInformation);
        } catch (e) {
          console.log(`invalid login flow ${e}`);
          return e
        }
      } else {
        // the page changed
        let orderIdSections = await page.$$('.' + targetSelectors);
        try {
          await traverseAccountPage(orderIdSections, scpResponseTemp, browser);
        } catch (e1) {
          console.log(e1);
          return e1;
        }
      }
    } catch (err) {
      console.log(`error in puppetteer actions js ${err}`);
      browser.close();
      scpResponseTemp.status = 'error';
      scpResponseTemp.orderIdList = [];
      await persistInformation(scpResponseTemp);
      return err;
      
    }
  
}
