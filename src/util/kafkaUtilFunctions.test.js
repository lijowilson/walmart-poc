import {kafkaConsumer, kafkaObject, pushKafkaMsg} from "./kafkaUtilFunctions";
import propertiesReader from 'properties-reader';

const properties = propertiesReader('./properties/config.properties');
const topicName = properties.get('kafka-topic');
const message = 'test-producer-message1';
describe('testing kafka producer and consumer code', () => {
  test('testing the kafka producer', async () => {
    const producer = kafkaObject().producer();
    await pushKafkaMsg(message, topicName, producer);
    expect(1);
  }, 50000);
  
  test('testing kafka consumer flow', async () => {
    const recievedMsg = await getKafkaMessage(kafkaObject, topicName);
    expect(recievedMsg).toEqual(message);
  }, 50000);
  
});

export const getKafkaMessage = async (kafkaObject, topic) => {
  //initialization of kafka-node object
  const consumer = kafkaConsumer(kafkaObject);
  let readMessage = '';
  try {
    readMessage = await readKafka(topic, consumer);
    await consumer.disconnect();
  } catch (err) {
    console.log(`error in getkafkamessage=${err.message}`);
  }
  return readMessage;
};

export const readKafka = async (topicName, consumer) => {
  return new Promise((resolve, reject) => {
    const run = async () => {
      await consumer.connect();
      await consumer.subscribe({topic: topicName});
      await consumer.run({
        autoCommitInterval: 5000
        , eachMessage: async ({topic, partition, message}) => {
          if (message.value !== 'undefined') {
            message = JSON.parse(message.value);
            resolve(message);
          }
          
        }
      })
    };
    return run();
  });
  
  
};