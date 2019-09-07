let express = require('express');
let app = express();

let server = app.listen(3000, function() {});

let MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

// let lcEnv = 'dev';
let lcEnv = 'live';

if (lcEnv == 'live') {
  lcOriginUrl = 'https://librachecker.com';
}
else {
  lcOriginUrl = 'http://localhost:8080';
}


// Libra Checker

app.get('/', (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", lcOriginUrl);
  res.send('Librachecker.com API');
});


app.get('/recent_txn', (req, res) => {
  recentTxn(res);
});

function recentTxn(res) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("libra-local");
    dbo.collection("transactions").find({}).sort({_id:-1}).limit(50).toArray(function(err, result) {
      if (err) throw err;
      db.close();
      result = JSON.stringify(result);
      res.setHeader("Access-Control-Allow-Origin", lcOriginUrl);
      res.setHeader('Content-Type', 'application/json');
      res.end(result);
    });
  });
}


app.get('/address_info', (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", lcOriginUrl);
  res.setHeader('Content-Type', 'application/json');

  addressDetails(req.query.address, res);
});

function addressDetails(req, res) {
  MongoClient.connect(url, function(err, db) {

    if (err) throw err;
    var dbo = db.db("libra-local");
    dbo.collection("addresses").findOne({_id: req}, function(err, result) {
      if (err) throw err;
      let balance = 0;
      let txs = [];
      let itemsProcessed = 0;
      if (typeof(result.received) != 'undefined') {
        result.received.forEach(tx => {
          dbo.collection("transactions").findOne({_id: Number(tx)}, function(err, result2) {
            if (err) throw err;
            // add to balance
            balance += result2.value;
            txs.push(result2);
            itemsProcessed++;
            if (itemsProcessed == result.received.length) {
              processSent();
            }
          });
        });
      }
      else { 
        processSent() 
      }
     
      function processSent() {
        let itemsProcessed = 0;
        if(typeof(result.sent) != 'undefined') {
          result.sent.forEach(tx => {
            dbo.collection("transactions").findOne({_id: Number(tx)}, function(err, result2) {
              if (err) throw err;
              balance -= result2.value;
              txs.push(result2);
              itemsProcessed++;
              if (itemsProcessed == result.sent.length) {
                prepareData();
              }
            });
          });
        }
        else { prepareData(); }
      }

      function prepareData() {
        // console.log(balance, txs)
        txs.sort(function (a, b) {
          var aNum = parseInt(a._id);
          var bNum = parseInt(b._id);
          return bNum - aNum;
        });
        txs = txs.slice(0,50);
        console.log(txs);
        returnData();
      }

      function returnData() {
        db.close();
        res.end(JSON.stringify({balance: balance, txs: txs}));
      }
    });
  });
}


app.get('/txn_info', (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", lcOriginUrl);
  res.setHeader('Content-Type', 'application/json');

  // console.log(req.query._id);
  txnDetails(req.query._id, res);
});

function txnDetails(req, res) {

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("libra-local");
    dbo.collection("transactions").findOne({_id: Number(req)}, function(err, result) {
      if (err) throw err;
      db.close();
      result = JSON.stringify(result);
      res.end(result);
    });
  });
}
