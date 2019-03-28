import * as puppeteerController from "../actions/puppeteerActions"
import {emptyScrapingResponse} from "./utilFunctions"
import * as kafka from "kafkajs"
import propertiesReader from 'properties-reader'
const properties = propertiesReader('./properties/config.properties')

export const kafkaObject = () => {
  
  const KAFKA_BROKER = properties.get("kafka-host")
  const CLIENT_ID = properties.get('kafka-CLIENT_ID')
  
  const kafkaObj = new kafka.Kafka({
    brokers: [KAFKA_BROKER]
    , clientId: CLIENT_ID
  })
  
  return kafkaObj
}

export const kafkaConsumer = (kafka) => {
  const CONSUMER_GROUP_NAME = properties.get('kafka-consumergroup')
  const kafkaConsume = kafka().consumer({groupId: CONSUMER_GROUP_NAME})
  
  return kafkaConsume
}

export const signalTrapFunc = (signalTraps, obj, process) => {
  signalTraps.map(type => {
    process.once(type, async () => {
      try {
        await obj.disconnect()
      } finally {
        process.kill(process.pid, type)
        throw new Error('Error for Type'+type)
      }
    })
  })
}

export const errorTypesFunc = (errorTypes, obj, process) => {
  errorTypes.map(type => {
    process.on(type, async () => {
      try {
        console.log(`process.on ${type}`)
        await obj.disconnect()
        process.exit(0)
      } catch (_) {
        process.exit(1)
      }
    })
  })
}

export const pushKafkaMsg = async (message, topicName, producerObj) => {
  
  const run = async () => {
    try {
      let stringMsg = JSON.stringify(message)
      let tempMessage = [{value: stringMsg}]
      await producerObj.connect()
      await producerObj.send({
        topic: topicName
        , messages: tempMessage
        //messages: JSON.stringify(message)
      })
      //return resolve("success")
    } catch (er) {
      console.log('error => ', er)
      await producerObj.disconnect()
      //return reject(er)
      
    }
    await producerObj.disconnect()
  }
  return run();
}

export const readKafkaMsg = async (topicName, consumer) => {
  const run = async () => {
    await consumer.connect()
    await consumer.subscribe({topic: topicName})
    await consumer.run({
      autoCommitInterval: 5000
      , eachMessage: async ({topic, partition, message}) => {
        if (message.value !== 'undefined') {
          message = JSON.parse(message.value)
          let [username, password] = [message.username, message.password]
          const BASEURL = properties.get('walmart-baseurl')
          const TGT_SELCTOR = properties.get('walmart-orderSection-selector')
          
          console.log('username' + username + 'password' + password)
          let scrapingRepsonseTMP = emptyScrapingResponse()
          
          scrapingRepsonseTMP.scrapeJobId = message.scrapeJobId
          scrapingRepsonseTMP.status = message.status
          scrapingRepsonseTMP.orderIds = message.orderIds
          try {
            console.log('puppetter invoked...')
            await puppeteerController.invokePuppeteer(BASEURL, username, password, TGT_SELCTOR, scrapingRepsonseTMP)
            
          } catch (err) {
            console.log('puppetter error ==>', err.message)
          }
          console.log('puppetter complete...')
          
        }
        
        
      }
    })
  }
  return run()
}
