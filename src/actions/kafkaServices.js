import process from 'process';
import propertiesReader from 'properties-reader';
import {
  kafkaObject
  , signalTrapFunc
  , errorTypesFunc
  , pushKafkaMsg
} from '../util/kafkaUtilFunctions';

const properties = propertiesReader('./properties/config.properties');

export function produceKafkaMessage(message) {
  
  const topicName = properties.get('kafka-topic');
  const producer = kafkaObject().producer();
  const errorTypes = ['unhandledRejection', 'uncaughtException'];
  const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
  return pushKafkaMsg(message, topicName, producer);
  errorTypesFunc(errorTypes, producer, process);
  signalTrapFunc(signalTraps, producer, process);
  
}

