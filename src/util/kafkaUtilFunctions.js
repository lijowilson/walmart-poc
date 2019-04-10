import {invokePuppeteer} from '../actions/puppeteerActions';
import {emptyScrapingResponse} from './utilFunctions';
import * as kafka from 'kafkajs';
import propertiesReader from 'properties-reader';
import {scrapeWalmart} from "../actions/postmanServices";

const properties = propertiesReader('./properties/config.properties');

export const kafkaObject = () => {
  
  const kafkaBroker = properties.get('kafka-host');
  const clientId = properties.get('kafka-CLIENT_ID');
  return new kafka.Kafka({
    brokers: [kafkaBroker]
    , clientId: clientId
  });
};

export const kafkaConsumer = (kafka) => {
  
  const consumerGroupName = properties.get('kafka-consumergroup');
  return kafka().consumer({groupId: consumerGroupName});
};

export const signalTrapFunc = (signalTraps, obj, process) => {
  signalTraps.map(type => {
    process.once(type, async () => {
      try {
        await obj.disconnect();
      } catch (e) {
        console.log(`error on signaltrap function => ${e}`);
      } finally {
        // noinspection JSUnresolvedFunction
        process.kill(process.pid, type);
      }
    })
  })
};

export const errorTypesFunc = (errorTypes, obj, process) => {
  errorTypes.map(type => {
    process.on(type, async () => {
      try {
        console.log(`process.on ${type}`);
        await obj.disconnect();
        process.exit(0);
      } catch (e) {
        console.log(`error with kafka errorTypes ->${e}`);
        process.exit(1);
      }
    })
  })
};

export const pushKafkaMsg = async (message, topicName, producerObj) => {
  
  const run = async () => {
    try {
      let stringMsg = JSON.stringify(message);
      let tempMessage = [{value: stringMsg}];
      await producerObj.connect();
      await producerObj.send({
        topic: topicName
        , messages: tempMessage
        //messages: JSON.stringify(message)
      });
      //return resolve("success")
    } catch (er) {
      console.log(`error => ${er}`);
      await producerObj.disconnect();
      //return reject(er)
    }
    await producerObj.disconnect();
  };
  return run();
};

export const readKafkaMsg = async (topicName, consumer) => {
  const run = async () => {
    await consumer.connect();
    await consumer.subscribe({topic: topicName});
    await consumer.run({
      autoCommitInterval: 1000
      , eachMessage: async ({topic, partition, message}) => {
        if (message.value !== 'undefined') {
          message = JSON.parse(message.value);
          let [username, password] = [message.username, message.password];
          const baseURL = properties.get('walmart-baseurl');
          const targetSelector = properties.get('walmart-orderSection-selector');
          const apiURL = properties.get('walmart-apiurl');
          const loginAPI = properties.get('walmart-signinapi-url');
          const loginPageURL = properties.get('walmart-loginurl');
          
          console.log(`username ${username} password ${password}`);
          let scrapingRepsonseTMP = emptyScrapingResponse();
          scrapingRepsonseTMP.scrapeJobId = message.scrapeJobId;
          scrapingRepsonseTMP.status = message.status;
          scrapingRepsonseTMP.orderIds = message.orderIds;
          try {
            console.log(`puppetter with API invoked...${new Date()}`);
            //await invokePuppeteer(baseURL, username, password, apiURL, scrapingRepsonseTMP);
            await scrapeWalmart(loginPageURL,username, password,loginAPI,apiURL,scrapingRepsonseTMP);
          } catch (err) {
            console.log(`puppetter/API error ==>${err}`);
          }
          console.log(`puppetter with API complete...${new Date()}`);
        }
        
      }
    })
  };
  return run();
};
