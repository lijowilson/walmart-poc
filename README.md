# walmart-poc

The objective of this project is to have a node js application which can scrape a specific page when the appropriate username & pwd are given for authentication of that website.

For swagger-ui, you can start node 
> npm run start

For accessing the swagger page, which is currently bundled with the node application:
http://localhost:8080/public/swagger-ui/index.html

Dependencies Used:
1. express
2. mongodb
3.puppetteer
  
MongoDB Name:
webscraper

MongoDB Collection Name:
scrapeboard

To Start the webApplication
> npm run dev-start

To Start the KafkaConsumer
> npm run dev-kafkaConsumer

To Build the transpiled Package:
> mkdir dist
>npm run build //to transpile package and move to dist folder
>npm run test-start // to start the web application
>npm run test-kafkaConsumer //to start the kafka consumer application



