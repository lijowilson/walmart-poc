import {persistInformation} from '../actions/mongoServices';

export const openBasePage = async (browser, page, baseURL, scpResponseTemp) => {
  try {
    //setting the useragent while invoking from GCP
    await page.setUserAgent('Mozilla/5.0 (Windows; U; Windows NT 5.1; de;' +
      ' rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3 (FM Scene 4.6.1)');
    await page.goto(baseURL);
    
  } catch (e) {
    console.log(`error while opening page with base url => ${e}`)
    scpResponseTemp.status = 'error';
    scpResponseTemp.orderIdList = [];
    await persistInformation(scpResponseTemp);
    await browser.close();
    throw new Error('Unable to open the base url provided');
  }
  
};

export const executeLogin = async (page, username, password) => {
  
  await page.waitForSelector('input[id="email"]');
  await page.type('input[id="email"]', username);
  await page.type('input[id="password"]', password);
  await page.click('button[type="submit"]');
  
};

export const invalidLoginFlow = async (browser, scpResponseTemp, persistInformation) => {
  
  scpResponseTemp.status = 'invalid credentials';
  scpResponseTemp.orderIdList = [];
  
  await persistInformation(scpResponseTemp);
  await browser.close();
  throw new Error('Invalid Credentials Entered')
};

export const traverseAccountPage = async (orderIdSections, scpResponseTemp, browser) => {
  try {
    let response = await extractOrderID(orderIdSections, scpResponseTemp);
    await persistInformation(response);
    await browser.close();
    return response;
  } catch (err) {
    console.log(err);
  }
  
  
};

export const extractOrderID = (orderIdSections, scpResponseTemp) => {
  let orderIdArr = [];
  return new Promise((resolve, reject) => {
    orderIdSections.map(document => {
      try {
        (async function r() {
          let orderID = await document.$eval('b', (b) => b.innerText);
          orderIdArr.push(orderID);
          if (orderIdSections.length == orderIdArr.length) {
            scpResponseTemp.orderIds = orderIdArr;
            scpResponseTemp.status = 'complete';
            resolve(scpResponseTemp);
          }
        })();
        
      } catch (err) {
        scpResponseTemp.status = 'error';
        console.log(`err in traverse account page function  ${err.message}`);
        reject(scpResponseTemp)
      }
    });
  });
};