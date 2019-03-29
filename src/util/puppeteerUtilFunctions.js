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

export const executeLogin = async (page, username, password, targetSelectors) => {
  
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
  
  //console.log('length of selectors ' + orderIDSections.length)
  let orderIdArr = [];
  for (let tile of orderIdSections) {
    let orderID = await tile.$eval('b', (b) => b.innerText);
    orderIdArr.push(orderID);
    console.log(orderID);
  }
  //populate transfer objects
  scpResponseTemp.orderIds = orderIdArr;
  scpResponseTemp.status = 'complete';
  
  await persistInformation(scpResponseTemp);
  await browser.close();
  return scpResponseTemp;
  
};