const mongoose = require('mongoose');
const mqtt = require('mqtt');
const express = require('express');
const port = 5001;
const bodyParser = require('body-parser');
const Device = require('./models/device'); 
mongoose.connect('mongodb+srv://osheen:Osheen9867@cluster0.ekzqil5.mongodb.net/mydb', {useNewUrlParser: true, useUnifiedTopology: true });
const app = express();
const randomCoordinates = require('random-coordinates');
app.use(express.static('public'));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({
    extended: true
}));

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

client.on('connect', () => { 
    client.subscribe('/sensorData');
    console.log('mqtt connected');
});

/*client.on('message', (topic, message) => {
    if (topic == '/sensorData') {
    var string2 = JSON.stringify(message);
    const data = JSON.parse(string2);
    console.log(`Received message on ${topic}: ${string2}`);
    }
  });*/

  client.on('message', (topic, message) => {
    if (topic == '/sensorData') {
      const data = JSON.parse(message);
  
      Device.findOne({"name": data.deviceId }, (err, device) => {
        if (err) {
          console.log(err)
        }
  
        const { sensorData } = device;
        const { ts, loc, temp } = data;
  
        sensorData.push({ ts, loc, temp });
        device.sensorData = sensorData;
  
        device.save(err => {
          if (err) {
            console.log(err)
          }
        });
      });
    }
  });


  
    app.put('/sensor-data', (req, res) => {
        const { deviceId }  = req.body;
      
        const [lat, lon] = randomCoordinates().split(", ");
        const ts = new Date().getTime();
        const loc = { lat, lon };
        min = Math.ceil(20);
        max = Math.floor(50);
        temp = Math.floor(Math.random() * (max - min + 1) + min);
      
        const topic = `/sensorData`;
        const message = JSON.stringify({ deviceId, ts, loc, temp });
      
        client.publish(topic, message, () => {
          res.send('published new message');
        });
      });
  
    

app.post('/send-command', (req, res) => {
    const { deviceId, command }  = req.body;
    const topic = `/os4778/command/${deviceId}`;
    client.publish(topic, command, () => {
      res.send('published new message');
    });
  });

app.listen(port, () => { 
    console.log(`listening on port ${port}`);
});


 /*const mqtt = require('mqtt');

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

client.on('connect', () => {
  console.log('connected');

  const topic = '/myid/test/hello/';
const msg = 'Hello MQTT world!';
client.publish(topic, msg, () => {
  console.log('message sent...');
});

});*/


