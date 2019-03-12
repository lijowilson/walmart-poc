const { Kafka } = require('kafkajs')
const PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./properties/config.properties');
var puppeteerCont = require('./controller/puppeteerController')

//initialization of kafka-node object

var kafkaBroker = properties.get("kafka.host");
var clientId = properties.get('kafka.clientId');
var topicName = properties.get('kafka.topic');
var consumerGroupName = properties.get('kafka.consumergroup');


const kafka = new Kafka({
    brokers: [kafkaBroker],
    clientId: clientId
  })

  const topic = topicName;
  const consumer = kafka.consumer({ groupId: consumerGroupName });
  
  const run = async () => {
    await consumer.connect()
    await consumer.subscribe({ topic })
    await consumer.run({
        autoCommitInterval: 5000,
      // eachBatch: async ({ batch }) => {
      //   console.log(batch)
      // },
      eachMessage: async ({ topic, partition, message }) => {
        const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`
        //console.log(`- ${prefix} ${message.key}#${message.value}`)
        var msgVal = message.value;
        console.log('message vlaue '+msgVal);
        if(typeof msgVal != "undefined"){
           message =  JSON.parse(msgVal);
           var baseurl = properties.get("walmart.baseurl");
           var username = message.username;
           var password = message.password;
           var targetSelector = properties.get("walmart.orderSection.selector");
           var scrapingRepsonseTMP =  {
            "scrapeJobId": "",
            "status": "",
            "orderIds": []
            };
            scrapingRepsonseTMP.scrapeJobId = message.scrapeJobId;
            scrapingRepsonseTMP.status = message.status;
            scrapingRepsonseTMP.orderIds = message.orderIds;
            puppeteerCont.invokePuppeteer(baseurl,username,password,targetSelector,scrapingRepsonseTMP);
           console.log('puppetter invoked...');
        }
      

      },
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