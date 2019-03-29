import mongoose from 'mongoose';
import process from 'process';
import propertiesReader from 'properties-reader';
import {
  kafkaObject,
  kafkaConsumer,
  readKafkaMsg,
  errorTypesFunc, signalTrapFunc
} from './util/kafkaUtilFunctions';
import {createMongoConnection} from "./util/mongooseUtilFunctions";
const properties = propertiesReader('./properties/config.properties');

//initialization of kafka-node object
const consumer = kafkaConsumer(kafkaObject);
const kafkaTopic = properties.get('kafka-topic');
const errorTypes = ['uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

//mongoose
createMongoConnection(mongoose);

readKafkaMsg(kafkaTopic, consumer);
errorTypesFunc(errorTypes, consumer, process);
signalTrapFunc(signalTraps, consumer, process);

