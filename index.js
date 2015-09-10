"use strict";
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var cheerio = require('cheerio');

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

function checkUrl(url, res) {
  request(url, function(err, response, html) {
    if (err) {
      return res.json({st:response.statusCode, error:err});
    }
    var $ = cheerio.load(html);
    if ($('title').text() === 'Service unavailable!') {
      return res.json({st:response.statusCode, error:"Service unavailable!"});
    }
    var avail = $('.availability-now', '#product-info').text().length > 0 ? 'Y':'N';
    console.log(avail);
    return res.json({st:response.statusCode, error:"", avail:avail});
  });
}

app.post('/url', function(req,res) {
  console.log(req.body);
  request(req.body.url, function(err, response, html) {
    if (err) {
      return res.json({st:response.statusCode, error:err});
    }
    var $ = cheerio.load(html);
    if ($('title').text() === 'Service unavailable!') {
      return res.json({st:response.statusCode, error:"Service unavailable!"});
    }
    var avail = $('.availability-now', '#product-info').text().length > 0 ? 'Y':'N';
    console.log(avail);
    if (avail === 'Y' && req.body.oldAvail === 'N') {
      return checkUrl(req.body.url, res);
    } else {
      return res.json({st:response.statusCode, error:"", avail:avail});
    }
  });
});

app.get('/', function(req, res) {
  res.send('Brick RleeME');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
