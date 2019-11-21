const lcAuth = require('./lcAuth.js');
const lcEnv = lcAuth.lcEnv();
const lcOriginUrl = lcAuth.lcOriginUrl();
const dbPassword = lcAuth.passPostgres();


const { Client } = require('pg');

let express = require('express');
let app = express();

let server = app.listen(3000, function() {});




//
// Libra Checker API Endpoints
//



app.get('/', (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", lcOriginUrl);
  res.send('Librachecker.com API');
});



app.get('/recent_txn', (req, res) => {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: dbPassword,
    port: 5432,
  });

  res.setHeader("Access-Control-Allow-Origin", lcOriginUrl);
  res.setHeader('Content-Type', 'application/json');

  async function asyncCall() {
    console.log('calling recentTxn');
    let response = await recentTxn(client);
    res.end(JSON.stringify(response));
  }
  asyncCall();
});

function recentTxn(client) {

  return new Promise(resolve => {

    client.connect();

    client.query('SELECT * FROM transactions ORDER BY id DESC LIMIT 50', (err, res) => {
      client.end();
      // console.log(err, res);
      resolve(res.rows);
    })

  })

}



app.get('/address_info', (req, res) => {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: dbPassword,
    port: 5432,
  });

  res.setHeader("Access-Control-Allow-Origin", lcOriginUrl);
  res.setHeader('Content-Type', 'application/json');

  async function asyncCall() {
    console.log('calling addressDetails');
    let response = await addressDetails(req.query.address, res, client);
    res.end(JSON.stringify(response));
  }
  asyncCall();
});

function addressDetails(req, res, client) {

  return new Promise (resolve => {

    const address = req;
    let addressBalance = 0;
  
    const queryBalance = {
      name: 'address-balance',
      text: 'SELECT balance FROM balances WHERE address = $1',
      values: [address],
    }
  
    const queryAddressLatestTxn = {
      name: 'address-latest-txn',
      text: 'SELECT * FROM transactions WHERE sender = $1 OR receiver = $1 ORDER BY id DESC LIMIT 50',
      values: [address],
    }
  
    client.connect();
  
    // let addressBalance = 0;
    client.query(queryBalance, (err, res) => {
      if (err) {
        console.log(err.stack);
      } else {
        console.log('queryBalance');
        
        if (typeof(res.rows[0]) != 'undefined') {
          if (res.rows[0].balance != null) {
            addressBalance = res.rows[0].balance;
          }
          console.log(addressBalance);
        }

      }
    })
  
    let addressLatestTxn = null;
  
    client.query(queryAddressLatestTxn, (err, res) => {
      if (err) {
        console.log(err.stack);
      } 
      else {
        console.log('queryAddressLatestTxn');
        client.end();
  
        addressLatestTxn = res.rows;
        // addressBalance = Number(addressBalance).toFixed(8);
        let resObj = { addressBalance, addressLatestTxn }
  
        resolve(resObj);
        // console.log(res.rows);
      }
    })

  })

}



app.get('/txn_info', (req, res) => {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: dbPassword,
    port: 5432,
  });
  
  res.setHeader("Access-Control-Allow-Origin", lcOriginUrl);
  res.setHeader('Content-Type', 'application/json');

  if(isNaN(req.query._id)) {
    res.end(JSON.stringify('not exist'));
  }

  // console.log(req.query._id);
  async function asyncCall() {
    console.log('calling txnDetails');
    let response = await txnDetails(req.query._id, res, client);
    if (typeof(response) == 'undefined') {
      res.end(JSON.stringify('not exist'));
    }
    else {
      res.end(JSON.stringify(response));
    }
  }
  asyncCall();
  
});

function txnDetails(req, res, client) {

  return new Promise(resolve => { 

    const queryGetTxnData = {
      name: 'get-txn-data',
      text: 'SELECT * FROM transactions WHERE id = $1',
      values: [req],
    }
    
    client.connect();
    
    client.query(queryGetTxnData, (err, res) => {
      if (err) {
        console.log(err.stack);
      } else {
        console.log('queryGetTxnData');
        client.end();
        resolve(res.rows[0]);
      }
    })

  });

}