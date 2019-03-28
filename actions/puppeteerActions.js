import puppeteer from 'puppeteer'
import * as mongoController from './mongoServices'

export function invokePuppeteer(baseurl, username, password, targetSelectors,
                                scpResponseTemp) {
  (async () => {
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
      
      try {
        let data = await mongoController.persistInformation(scpResponseTemp)
        //await browser.close()
        throw new Error('Unable to open the base url provided')
      } catch (error) {
        console.log(error)
        //throw error
        return error
      }
      
      
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
      try {
        let dataTemp = await mongoController.persistInformation(scpResponseTemp)
        await browser.close()
        throw new Error('Invalid Credentials Entered')
      } catch (e) {
        //console.log(e)
        return e
      }
      
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
      try {
        let dataTemp1 = await mongoController.persistInformation(scpResponseTemp)
        await browser.close()
        return scpResponseTemp
      } catch (e1) {
        console.log(e1)
        throw e1
      }
      
    }
    
  })()
  
}
