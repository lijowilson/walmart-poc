import * as kafka from 'kafkajs'
import process from 'process'
import propertiesReader from 'properties-reader'
let properties = propertiesReader('./properties/config.properties')

export function produceKafkaMessage (message) {
  
  return new Promise((resolve,reject) => {
  
 
  const KAFKA_BROKER = properties.get("kafka-host")
  const TOPIC_NAME = properties.get('kafka-topic')
  const CLIENT_ID = properties.get('kafka-clientId')
  
  let kafkaObj = new kafka.Kafka ({
      clientId: CLIENT_ID
    , brokers: [KAFKA_BROKER]
  })
  
  const producer = kafkaObj.producer()
  
  const run = async () => {
    var stringMsg = JSON.stringify(message)
    var tempMessage = [{value: stringMsg}]
    await producer.connect()
    await producer.send ({
        topic: TOPIC_NAME
      , messages: tempMessage
      //messages: JSON.stringify(message)
    })
    resolve("success")
  }
  
  run().catch (e => {
    console.error(`${clientId} ${e.message}`, e)
    resolve("error")
  })
  
  const errorTypes = ['unhandledRejection', 'uncaughtException']
  const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']
  
  errorTypes.map (type => {
    process.on (type, async () => {
      try {
        console.log(`process.on ${type}`)
        await producer.disconnect()
        process.exit(0)
        resolve("error")
      } catch (_) {
        process.exit(1)
      }
    })
  })
  
  signalTraps.map (type => {
    process.once(type, async () => {
      try {
        await producer.disconnect()
      } finally {
        process.kill(process.pid, type)
        resolve("error")
      }
    })
  })
  
  })//end of promise
}

