import puppeteer from 'puppeteer'
import * as mongoController from './mongoController'

export function invokePuppeteer (baseurl, username, password, targetSelectors,
                                scpResponseTemp) {
  try {
    
    (async () => {
      
      //added additional parameters to support dockerization
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
        , headless: true
      })
      const page = await browser.newPage()
      try {
        await page.setUserAgent('Mozilla/5.0 (Windows; U; Windows NT 5.1; de;' +
          ' rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3 (FM Scene 4.6.1)')
        await page.goto(baseurl)
      } catch (e) {
        scpResponseTemp.status = "error"
        scpResponseTemp.orderIdList = []
        console.log('temspscrapinfo inside error while opening url' +
          JSON.stringify(scpResponseTemp))
        mongoController.persistInformation(scpResponseTemp, data => {
          browser.close()
        })
      }
      //await page.goto(baseurl);
      
      await page.waitForSelector('input[id="email"]')
      await page.type('input[id="email"]', username)
      await page.type('input[id="password"]', password)
      await page.click('button[type="submit"]')
      await Promise.race([
        page.waitForSelector("." + targetSelectors),
        page.waitForSelector('#global-error > .button-link')
      ])
      
      if (await page.$('#global-error > .button-link')) {
        // there was an error
        scpResponseTemp.status = 'invalid credentials'
        scpResponseTemp.orderIdList = []
        mongoController.persistInformation(scpResponseTemp, data => {
          browser.close()
        })
      } else {
        // the page changed
        console.log('reached the account page')
        let orderIDSections = await page.$$("." + targetSelectors)
        //console.log('length of selectors ' + orderIDSections.length)
        let orderIdArr = []
        for (let tile of orderIDSections) {
          let orderID = await tile.$eval('b', (b) => b.innerText)
          orderIdArr.push(orderID)
          console.log(orderID)
        }
        
        scpResponseTemp.orderIds = orderIdArr
        scpResponseTemp.status = "complete"
        scpResponseTemp.scrapeJobId = scpResponseTemp.scrapeJobId
        mongoController.persistInformation(scpResponseTemp, data => {
          browser.close()
        })
      }
      
      
    })()
  } catch (e) {
    console.log('Error ', e)
  }
}
