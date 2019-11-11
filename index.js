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
  
    const queryReceiverTotalValue = {
      name: 'receiver-value',
      text: 'SELECT SUM(value) FROM transactions WHERE receiver = $1 AND status != $2',
      values: [address, 'failed'],
    }
  
    const querySenderTotalValue = {
      name: 'sender-value',
      text: 'SELECT SUM(value) FROM transactions WHERE sender = $1 AND status != $2',
      values: [address, 'failed'],
    }
  
    const queryAddressLatestTxn = {
      name: 'address-latest-txn',
      text: 'SELECT * FROM transactions WHERE sender = $1 OR receiver = $1 ORDER BY id DESC LIMIT 50',
      values: [address],
    }
  
    client.connect();
  
    let receiverTotalValue = 0;
    client.query(queryReceiverTotalValue, (err, res) => {
      if (err) {
        console.log(err.stack);
      } else {
        console.log('queryReceiverTotalValue');
        
        if (res.rows[0].sum != null) {
          receiverTotalValue = res.rows[0].sum;
        }
        // console.log(receiverTotalValue);
      }
    })
  
    let senderTotalValue = 0;
    client.query(querySenderTotalValue, (err, res) => {
      if (err) {
        console.log(err.stack);
      } else {
        console.log('querySenderTotalValue');
        
        if (res.rows[0].sum != null) {
          senderTotalValue = res.rows[0].sum;
        }
        // console.log(senderTotalValue);
  
        addressBalance = (receiverTotalValue - senderTotalValue).toFixed(8);
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
















//
//
// DEMOS DEMOS DEMOS 
//
//

// const { Pool, Client } = require('pg');

// POOL

// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'postgres',
//   password: dbPassword,
//   port: 5432,
// })

// pool.query('SELECT NOW()', (err, res) => {
//   console.log(err, res)
//   pool.end()
// })



// CLIENT

// const client = new Client({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'postgres',
//   password: dbPassword,
//   port: 5432,
// })

// client.connect()

// client.query('SELECT NOW()', (err, res) => {
//   console.log(err, res)
//   client.end()
// })




//
// DEMOS
//


// INSERT WITH PARAMETERS

// let TxnSerialized = "XXX";

// const text = 'INSERT INTO transactions(id, sender, receiver, value) VALUES($1, $2, $3, $4) RETURNING *'

// let i = 15500;
// client.connect();

// while (i < 100000) {

//   let id = 1 + i;
  
//   let values = [id, 'ea4a6d44b8b52c9333cc908e523625817b3232ed0fe9473b5e4fefb1e2f1e01e', '000000000000000000000000000000000000000000000000000000000a550c18', 99999.904564]

//   // callback
//   client.query(text, values, (err, res) => {
//     if (err) {
//       console.log(err.stack)
//     } else {
//       console.log('txn inserted');
//       // console.log(res.rows[0])
//     }
//   })

//   i++;
// }

// return;



// GET LATEST 50 TXN

// client.connect();

// client.query('SELECT * FROM transactions ORDER BY id DESC LIMIT 50', (err, res) => {
//   console.log(err, res);
//   client.end();

//   // return json, when API
// })

// return;



// GET ADDRESS INFO

// const address = 'ea4a6d44b8b52c9333cc908e523625817b3232ed0fe9473b5e4fefb1e2f1e01e';
// // const address = '000000000000000000000000000000000000000000000000000000000a550c18';

// let addressBalance = 0;

// const queryReceiverTotalValue = {
//   name: 'receiver-value',
//   text: 'SELECT SUM(value) FROM transactions WHERE receiver = $1',
//   values: [address],
// }

// const querySenderTotalValue = {
//   name: 'sender-value',
//   text: 'SELECT SUM(value) FROM transactions WHERE sender = $1',
//   values: [address],
// }

// const queryAddressLatestTxn = {
//   name: 'address-latest-txn',
//   text: 'SELECT * FROM transactions WHERE sender = $1 OR receiver = $1 ORDER BY id DESC LIMIT 50',
//   values: [address],
// }

// client.connect()

// let receiverTotalValue = 0;
// client.query(queryReceiverTotalValue, (err, res) => {
//   if (err) {
//     console.log(err.stack);
//   } else {
//     console.log('queryReceiverTotalValue');
    
//     if (res.rows[0].sum != null) {
//       receiverTotalValue = res.rows[0].sum;
//     }
//     console.log(receiverTotalValue);
//   }
// })

// let senderTotalValue = 0;
// client.query(querySenderTotalValue, (err, res) => {
//   if (err) {
//     console.log(err.stack);
//   } else {
//     console.log('querySenderTotalValue');
    
//     if (res.rows[0].sum != null) {
//       senderTotalValue = res.rows[0].sum;
//     }
//     console.log(senderTotalValue);

//     addressBalance = (receiverTotalValue - senderTotalValue).toFixed(8);
//   }
// })

// let addressLatestTxn = null;

// client.query(queryAddressLatestTxn, (err, res) => {
//   if (err) {
//     console.log(err.stack);
//   } else {
//     console.log('queryAddressLatestTxn');

//     addressLatestTxn = res.rows;
    
//     let resObj = { addressBalance, addressLatestTxn }

//     console.log(resObj);

//     // console.log(res.rows);
//   }
// })

// return;






// GET TXN INFO

// let id = 7894;

// const queryGetTxnData = {
//   name: 'get-txn-data',
//   text: 'SELECT * FROM transactions WHERE id = $1',
//   values: [id],
// }

// client.connect()

// client.query(queryGetTxnData, (err, res) => {
//   if (err) {
//     console.log(err.stack);
//   } else {
//     console.log('queryGetTxnData');
//     console.log(res.rows);
//   }
// })



