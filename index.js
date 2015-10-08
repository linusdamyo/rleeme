"use strict";
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var cheerio = require('cheerio');
var Q = require('q');
var debug = require('debug')('rleeme');

app.set('port', (process.env.PORT || 5567));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

function checkUrl(url) {
  var deferred = Q.defer();
  request(url, function(err, response, html) {
    if (err) {
      deferred.reject(new Error(err));
      return deferred.promise;
    }
    var $ = cheerio.load(html);
    if ($('title').text() === 'Service unavailable!') {
      deferred.reject(new Error('Service unavailable!'));
      return deferred.promise;
    }
    var avail = $('.availability-now', '#product-info').text().length > 0 ? 'Y':'N';
    debug(avail);
    deferred.resolve({st:response.statusCode, error:"", avail:avail});
  });
  return deferred.promise;
}

function testError() {
  var deferred = Q.defer();
  deferred.reject(new Error('Test Error!'));
  return deferred.promise;
}

app.post('/url', function(req, res) {
  debug(req.body);
  checkUrl(req.body.url)
  .then(function(result) {
    if (result.avail === 'Y' && req.body.oldAvail === 'N') {
      return checkUrl(req.body.url);
    }
    return result;
  })
  .then(function(result) {
    debug(result);
    return res.json(result);
  })
  .fail(function(err) {
    debug(err);
    return res.json({st:'', error: err.message});
  });
});

app.get('/test/error', function(req, res) {
  testError()
  .then(function(result) {
    debug('cannot reach here.');
    return res.json({st:'', error:'cannot reach here.'});
  })
  .fail(function(err) {
    debug(err);
    return res.json({st:'', error: err.message});
  });
});

app.get('/', function(req, res) {
  res.send('Brick RleeME');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
