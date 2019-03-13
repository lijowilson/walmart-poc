const puppeteer  = require('puppeteer');
var mongocontroller = require('../controller/mongoController');
module.exports = {

    invokePuppeteer : function(baseurl,username,password,targetSelectors,scpResponseTemp){
        try{
           
            
        (async () => {
           console.log('initial values username='+username+'scrapingid='+scpResponseTemp.scrapeJobId)
           
			//added additional parameters to support dockerization
            const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'] ,headless:true});
            const page = await browser.newPage();
            try {
				await page.setUserAgent('Mozilla/5.0 (Windows; U; Windows NT 5.1; de; rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3 (FM Scene 4.6.1)');
				
                await page.goto(baseurl);
              } catch(e) {
                scpResponseTemp.status = "error";
                scpResponseTemp.orderIdList =[];
                console.log('temspscrapinfo inside error while opening url'+JSON.stringify(scpResponseTemp));
                mongocontroller.persistInformation(scpResponseTemp,function(data){
                browser.close();
                });
            }
            //await page.goto(baseurl);
			
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
                scpResponseTemp.status = "invalid credentials";
                scpResponseTemp.orderIdList =[];
                //console.log('temspscrapinfo inside invalid login'+JSON.stringify(scpResponseTemp));
                //console.log('username='+username);
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
                //console.log('temspscrapinfo inside valid login'+JSON.stringify( scpResponseTemp));
                //console.log('username='+username);
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