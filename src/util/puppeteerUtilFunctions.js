import {persistInformation, persistOrderInfo} from '../actions/mongoServices';

const excludedResourses = ['image', 'stylesheet', 'font'];

export const openBasePage = async (browser, page, baseURL, scpResponseTemp) => {
  try {
    //setting the useragent while invoking from GCP
    await page.setUserAgent('Mozilla/5.0 (Windows; U; Windows NT 5.1; de;' +
      ' rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3 (FM Scene 4.6.1)');
    await page.goto(baseURL);
    
  } catch (e) {
    console.log(`error while opening page with base url => ${e}`);
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

export const invokeAcctPageAPI = async (page, scpResponseTemp, browser, apiURL) => {
  try {
    await page.goto(apiURL);
    await page.content();
    const innerText = await page.evaluate(() => {
      return JSON.parse(document.querySelector('body').innerText);
    });
    const ordersInfo = innerText.orders;
    const orderIdArr = getOrderIds(ordersInfo);
    scpResponseTemp.orderIds = orderIdArr;
    scpResponseTemp.status = 'complete';
    await persistInformation(scpResponseTemp);
    
    //save product information for orders
    if (orderIdArr.length > 0) {
      let orderArray = getOrderInfo(ordersInfo, scpResponseTemp.scrapeJobId);
      await persistOrderInfo(orderArray);
      await browser.close();
      
    }
    return scpResponseTemp;
  } catch (err) {
    scpResponseTemp.status = 'error';
    await persistInformation(scpResponseTemp);
    console.log(err);
  }
};

export const getOrderIds = (orderArr) => {
  let orderIdArr = [];
  for (let orderObj of orderArr) {
    orderIdArr.push(orderObj.id);
  }
  return orderIdArr;
};

export const getOrderInfo = (orderArrayObj, customerId) => {
  let orderObjArr = [];
  
  for (let order of orderArrayObj) {
    let orderObj = {
      customerId: customerId,
      orderId: order.id,
      productList: []
    };
    orderObj.productList = getProductInfo(order.items);
    orderObjArr.push(orderObj);
  }
  return orderObjArr;
};

export const getProductInfo = (productArray) => {
  let productList = [];
  for (let product of productArray) {
    productList.push(product.name);
  }
  return productList;
};

export const initializeLoginPage = async (page, browser, loginPageURL) => {
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows; U; Windows NT 5.1; de;' +
      ' rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3 (FM Scene 4.6.1)');
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      //console.log('req resourcetype',req.resourceType());
      if (excludedResourses.includes(req.resources)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    await page.goto(loginPageURL);
  } catch (err) {
    console.log(`error while invoking the initializeLoginPage with puppetteer ${err.message}`);
    browser.close();
    throw new err;
  }
};


export const injectScriptForSession = async (page, browser) => {
  
  let sessionId = '';
  try {
    sessionId = await page.evaluate(`(async () => {
      let n = await window._cf;
        n.push(["_setJsPost", !1]),
        n.push(["_setJavaScriptKey", 'HCb1TagWCCGNL371scHO5Sbi6E4Wn0LxTKbYVasqjXO']),
        n.push(["_setInitTime", Date.now ? Date.now() : +new Date]),
        n.push(["_setEnReadDocUrl", !1]);
      let t = await document.getElementById('sign-in-form');
      let n1 = await document.createElement('input');
      let tempid = 'cf-input';
      n1.setAttribute('id', tempid),
        n1.setAttribute("name", "captcha.sensorData"),
        n1.setAttribute("type", "hidden"),
        await document.getElementById('sign-in-form').appendChild(n1),
        await window._cf.push(["_setSDFieldNames", n1.id]);
  
      await window.cf.cfsubmit();
  
  
      //console.log('session is',document.getElementById('cf-input').value);
      return Promise.resolve(await document.getElementById('cf-input').value);
      
    })()`);
    await browser.close();
  } catch (err) {
    console.log(`exception while injecting script to cyberfend ${err.message}`);
    browser.close();
    throw err;
  }
  return sessionId;
};

/*
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
*/