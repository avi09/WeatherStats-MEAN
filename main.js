var request = require('request');
var access_key = require('./key.json')[1]['key'];

const fs = require('fs');
var express = require('express');
var site = express();
var path = require('path');
site.use(express.static('./'));

function fetch_and_update()
{
  var stored_data = require('./stored_data.json');
  var stored_data = stored_data[stored_data.length-1];
  if (stored_data.length==0 || Math.abs(new Date(stored_data) - new Date())>3600000)
  {
    console.log("No Data or Data older than 1 hour. Fetching new Data.");
    var lati, long;
    var current = new Date().toString();
    var fname = 'stored_data - '+current+'.json';
    fs.writeFile('./'+fname, JSON.stringify([]), function(error){

      var stored_data = require('./'+fname);
      for (lati = -25; lati <= 50; lati+=25)
      {
        for (long = -150; long <= 150; long+=50)
        {
          const options = {method: 'GET', url: 'https://api.climacell.co/v3/weather/realtime', qs: {lat: lati, lon: long, unit_system: 'si',
          fields: 'temp,humidity,wind_speed,baro_pressure,precipitation,visibility,cloud_cover,surface_shortwave_radiation,pm25,co,so2,pollen_tree', apikey: access_key}};
          request(options, function (error, response, body){
            if (error)
            {
              throw new Error(error);
              return;
            }
            var body = JSON.parse(body);
            if (body["message"])
            {
              console.log("Rate Limit");
              return;
            }
            console.log(body);
            let rc = {
            lat: body["lat"], lon: body["lon"], temp: body["temp"]["value"], humidity: body["humidity"]["value"], wind_speed: body["wind_speed"]["value"],
            baro_pressure: body["baro_pressure"]["value"], precipitation: body["precipitation"]["value"], visibility: body["visibility"]["value"],
            cloud_cover: body["cloud_cover"]["value"], surface_shortwave_radiation: body["surface_shortwave_radiation"]["value"],
            pm25: body["pm25"]["value"], co: body["co"]["value"], so2: body["so2"]["value"], pollen_tree: body["pollen_tree"]["value"],
            time: new Date().toString()};
            stored_data.push(rc);
            fs.writeFile('./'+fname, JSON.stringify(stored_data), err => { if (err) throw err;
              var stored_data = require('./'+fname);
            });
          });
        }
      }
      var stored_data1 = require('./stored_data.json');
      stored_data1.push(current);
      fs.writeFile('./stored_data.json', JSON.stringify(stored_data1), err => { if (err) throw err;});

    });
  }
}

site.get('/get_data', function(req, res){
  fetch_and_update(function (error){});
  let recent_store = require('./stored_data.json');
  res.json(recent_store);
});

site.get('/get_data_on', function(req, res){
  var source = req.url.toString();
  source = source.split('?')[1].substring(5);
  source = source.split('%20');
  var fn1 = "";
  for (xx in source)
  {
    if (xx!=source.length-1) fn1+=source[xx]+" ";
    else fn1+=source[xx];
  }
  var fn = 'stored_data - '+fn1+'.json';
  res.json(require('./'+fn, function(err){console.log("Not Found");}));
});

site.get('/', function(req, res){
  res.sendFile(path.join(__dirname+'/home.html'));
});

var server = site.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})


/*
let options1 = {method: 'GET', url: 'https://api.climacell.co/v3/weather/realtime', qs: {lat: '32.0853', lon: '-34.7818', unit_system: 'si',
  fields: 'pm25', apikey: 'Q4tuMSAMgyToqrr5vycJ0b8aFhyvrdFI'}};

request(options1, function (error, response, body)
{
  if (error) throw new Error(error);
  console.log(body);
});
*/
