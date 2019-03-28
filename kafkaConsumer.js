import {
  kafkaObject,
  kafkaConsumer,
  readKafkaMsg,
  errorTypesFunc, signalTrapFunc
} from "./util/kafkaUtilFunctions";
import propertiesReader from 'properties-reader'
import process from 'process'
let properties = propertiesReader('./properties/config.properties')

//initialization of kafka-node object
const consumer = kafkaConsumer(kafkaObject)
const KAFKA_TOPIC = properties.get('kafka-topic')
const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

readKafkaMsg(KAFKA_TOPIC,consumer)
errorTypesFunc(errorTypes,consumer,process)
signalTrapFunc(signalTraps,consumer,process)

