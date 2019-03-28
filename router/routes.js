import express from 'express'
import {pushToKafka,fetchScrapeStatus} from "./actions";
let router = express.Router()

router
  .post('/scrapeInfoForUser', pushToKafka)
  .get('/fetchScrapingStatus/:scrapeId', fetchScrapeStatus)

export default router
