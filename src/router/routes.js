import express from 'express'
import {pushToKafka,fetchScrapeStatus} from './actions';
const router = express.Router();

// noinspection JSUnresolvedFunction
router
  .post('/scrapeInfoForUser', pushToKafka)
  .get('/fetchScrapingStatus/:scrapeId', fetchScrapeStatus);

export default router;
