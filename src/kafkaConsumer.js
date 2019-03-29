import {
  kafkaObject,
  kafkaConsumer,
  readKafkaMsg,
  errorTypesFunc, signalTrapFunc
} from './util/kafkaUtilFunctions';
import propertiesReader from 'properties-reader';
import process from 'process';

const properties = propertiesReader('./properties/config.properties');
import mongoose from 'mongoose';
import {createMongoConnection} from "./util/mongooseUtilFunctions";

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

