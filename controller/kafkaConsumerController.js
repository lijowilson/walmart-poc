import * as kafkaObj from 'kafkajs'
import propertiesReader from 'properties-reader'
import * as puppeteerController from './puppeteerController'
let properties = propertiesReader('./properties/config.properties')

//initialization of kafka-node object

const KAFKA_BROKER = properties.get("kafka-host")
const CLIENT_ID = properties.get('kafka-CLIENT_ID')
const TOPIC = properties.get('kafka-topic')
const CONSUMER_GROUP_NAME = properties.get('kafka-consumergroup')


const kafka = new kafkaObj.Kafka({
  brokers: [KAFKA_BROKER]
  , clientId: CLIENT_ID
})

const consumer = kafka.consumer({groupId: CONSUMER_GROUP_NAME})

const run = async () => {
  await consumer.connect()
  console.log('topicName' + TOPIC)
  await consumer.subscribe({topic: TOPIC})
  await consumer.run({
    autoCommitInterval: 5000
    , eachMessage: async ({topic, partition, message}) => {
      let msgVal = message.value
      console.log('message vlaue ' + msgVal)
      if (typeof msgVal != "undefined") {
        message = JSON.parse(msgVal)
        let baseurl = properties.get('walmart-baseurl')
        let username = message.username
        let password = message.password
        let targetSelector = properties.get('walmart-orderSection-selector')
        let scrapingRepsonseTMP = {
          "scrapeJobId": ""
          , "status": ""
          , "orderIds": []
        }
        scrapingRepsonseTMP.scrapeJobId = message.scrapeJobId
        scrapingRepsonseTMP.status = message.status
        scrapingRepsonseTMP.orderIds = message.orderIds
        try{
          console.log('puppetter invoked...')
          await puppeteerController.invokePuppeteer(baseurl,username,password,targetSelector,scrapingRepsonseTMP)
  
        }catch(err){
          console.log('puppetter error ==>',err.message)
        }
        console.log('puppetter complete...')
       
      }
      
      
    }
  })
}

run().catch(e => console.error(`[Kafka/consumer] ${e.message}`, e))

const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.map(type => {
  process.on(type, async e => {
    try {
      console.log(`process.on ${type}`)
      console.error(e)
      await consumer.disconnect()
      process.exit(0)
    } catch (_) {
      process.exit(1)
    }
  })
})

signalTraps.map(type => {
  process.once(type, async () => {
    try {
      await consumer.disconnect()
    } finally {
      process.kill(process.pid, type)
    }
  })
})

