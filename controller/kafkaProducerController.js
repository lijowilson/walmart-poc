const { Kafka } = require('kafkajs')
const PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./properties/config.properties');

module.exports = {

    produceKafkaMessage: function(message,callback){

        
    var kafkaBroker = properties.get("kafka.host");
    var topicName = properties.get('kafka.topic');
    var clientId = properties.get('kafka.clientId');

    const kafka = new Kafka({
        clientId: clientId,
        brokers: [kafkaBroker]
      });

      const producer = kafka.producer()
  
      const run = async () => {
        var stringMsg = JSON.stringify(message);
        var tempMessage =[{value : stringMsg}];
        await producer.connect()
        await producer.send({
            topic: topicName,
            messages:tempMessage,
           //messages: JSON.stringify(message)
        });
        return callback("success");
      }
      
      run().catch(function(e){
          console.error(`${clientId} ${e.message}`, e);
          return callback("error");
      });
      
      const errorTypes = ['unhandledRejection', 'uncaughtException']
      const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']
      
      errorTypes.map(type => {
        process.on(type, async () => {
          try {
            console.log(`process.on ${type}`)
            await producer.disconnect()
            process.exit(0)
            callback("error");
          } catch (_) {
            process.exit(1)
          }
        })
      });
      
      signalTraps.map(type => {
        process.once(type, async () => {
          try {
            await producer.disconnect()
          } finally {
            process.kill(process.pid, type)
            callback("error");
          }
        })
      });


    }

};