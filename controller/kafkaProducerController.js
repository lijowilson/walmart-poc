import * as kafka from 'kafkajs'
import propertiesReader from 'properties-reader'
let properties = propertiesReader('./properties/config.properties')

export function produceKafkaMessage (message, callback) {
  
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
    return callback("success")
  }
  
  run().catch (e => {
    console.error(`${clientId} ${e.message}`, e)
    return callback("error")
  })
  
  const errorTypes = ['unhandledRejection', 'uncaughtException']
  const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']
  
  errorTypes.map (type => {
    process.on (type, async () => {
      try {
        console.log(`process.on ${type}`)
        await producer.disconnect()
        process.exit(0)
        callback("error")
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
        callback ("error")
      }
    })
  })
  
  
}

