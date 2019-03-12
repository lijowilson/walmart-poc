const puppeteer  = require('puppeteer');
var mongocontroller = require('../controller/mongoController');
module.exports = {

    invokePuppeteer : function(baseurl,username,password,targetSelectors,scpResponseTemp){
        try{
           
            
        (async () => {
           console.log('initial values username='+username+'scrapingid='+scpResponseTemp.scrapeJobId)
           
          
            const browser = await puppeteer.launch({headless: true});
            const page = await browser.newPage();
            await page.goto(baseurl);
            await page.waitForSelector('input[id="email"]');
            await page.type('input[id="email"]', username);
            await page.type('input[id="password"]', password);
            await page.click('button[type="submit"]');
            await Promise.race([
                page.waitForSelector("."+targetSelectors),
                page.waitForSelector("#global-error > .button-link")
              ]);
              
              if (await page.$("#global-error > .button-link")) {
                // there was an error
               
                console.log(page+":::::::::::::::::::::::::")
                console.log('Invalid login Credentials');
               
                scpResponseTemp.status = "invalid credentials";
                scpResponseTemp.orderIdList =[];
                console.log('temspscrapinfo inside invalid login'+JSON.stringify(scpResponseTemp));
                console.log('username='+username);
                mongocontroller.persistInformation(scpResponseTemp,function(data){
                browser.close();
                });
              } else {
                // the page changed
                console.log('reached the account page');
                var orderIDSections  = await page.$$("."+targetSelectors);
                console.log('length of selectors '+orderIDSections.length);
                var orderIdArr = [];
                for(var tile of orderIDSections){
                    var orderID = await tile.$eval('b', (b) => b.innerText);
                    orderIdArr.push(orderID);
                    console.log(orderID);
                }
              
                scpResponseTemp.orderIds = orderIdArr;
                scpResponseTemp.status = "complete";
                scpResponseTemp.scrapeJobId = scpResponseTemp.scrapeJobId;
                console.log('temspscrapinfo inside valid login'+JSON.stringify( scpResponseTemp));
                console.log('username='+username);
                mongocontroller.persistInformation(scpResponseTemp,function(data){
                    browser.close();
                });
              }
           
         
 
          })();
        }catch(e){
            console.log('Error ',e);
        }
    }


};