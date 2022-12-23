const fs = require('fs');
const crypto = require('crypto');
const { Buffer } = require('node:buffer');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const loaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};
const packageDefinition = protoLoader.loadSync(
  [
    './lnd_grpc/proto/lightning.proto',
    './lnd_grpc/proto/invoices.proto',
    './lnd_grpc/proto/router.proto',
  ],
  loaderOptions,
);
require('dotenv').config();
const lnrpc = grpc.loadPackageDefinition(packageDefinition).lnrpc;
const invoicesrpc = grpc.loadPackageDefinition(packageDefinition).invoicesrpc;
const routerrpc = grpc.loadPackageDefinition(packageDefinition).routerrpc;
const macaroon = fs.readFileSync(process.env.LND_GRPC_MACAROON).toString('hex');
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';
const lndCert = fs.readFileSync(process.env.LND_GRPC_CERT);
const sslCreds = grpc.credentials.createSsl(lndCert);
const macaroonCreds = grpc.credentials.createFromMetadataGenerator(function (args, callback) {
  const metadata = new grpc.Metadata();
  metadata.add('macaroon', macaroon);
  callback(null, metadata);
});
const creds = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
const lightning = new lnrpc.Lightning(
  `${process.env.LND_GRPC_ENDPOINT}:${process.env.LND_GRPC_PORT}`,
  creds,
);
const invoices = new invoicesrpc.Invoices(
  `${process.env.LND_GRPC_ENDPOINT}:${process.env.LND_GRPC_PORT}`,
  creds,
);
const router = new routerrpc.Router(
  `${process.env.LND_GRPC_ENDPOINT}:${process.env.LND_GRPC_PORT}`,
  creds,
);


const lndService = {
  getInfo() {
    const request = {};
    return new Promise((resolve, reject) => {
      lightning.getInfo(request, (error, response) => {
        if (error) {
          return reject(error);
        }
        return resolve(response);
      });
    });
  },
  addInvoice(value, memo) {
    const request = {
      value: value,
      memo: memo,
    };
    return new Promise((resolve, reject) => {
      lightning.addInvoice(request, (error, response) => {
        if (error) {
          return reject(error);
        }
        return resolve(response);
      });
    });
  },
  subscribeSingleInvoice(r_hash, res) {
    const request = {
      r_hash,
    };
    const call = invoices.subscribeSingleInvoice(request);
    console.log('SubscribeSingleInvoice');
    call.on('data', async function (response) {
      // A response was received from the server.
      console.log(response.state);
      if (response.state == 'ACCEPTED') {
        // Handle business logic
        // 1. Claim NFT to Buyer
        // 2. Send Bitcoin to Seller
        // 3. Request to settle/cancel invoice
        // Cancel invoice
        // lndService.cancelInvoice(global.payment_hash);
        // Settle invoice
        lndService.settleInvoice(global.preimage);
      }
    });
    call.on('end', async function () {
      // The server has closed the stream.
      console.log('The server has closed the stream.');
    });
  },
  sendCoins(addr, amount) {
    const request = {
      addr,
      amount,
    };
    return new Promise((resolve, reject) => {
      lightning.sendCoins(request, (error, response) => {
        if (error) {
          return reject(error);
        }
        return resolve(response);
      });
    });
  },
  addHoldInvoice(value, memo, payment_hash) {
    const request = {
      value: value,
      memo: memo,
      hash: payment_hash,
    };
    return new Promise((resolve, reject) => {
      invoices.addHoldInvoice(request, (error, response) => {
        if (error) {
          return reject(error);
        }
        return resolve(response);
      });
    });
  },
  cancelInvoice(payment_hash) {
    const request = {
      payment_hash: Buffer.from(payment_hash, 'hex'),
    };
    return new Promise((resolve, reject) => {
      invoices.cancelInvoice(request, (error, response) => {
        if (error) {
          return reject(error);
        }
        return resolve(response);
      });
    });
  },
  settleInvoice(preimage) {
    const request = {
      preimage: Buffer.from(preimage, 'hex'),
    };
    return new Promise((resolve, reject) => {
      invoices.settleInvoice(request, (error, response) => {
        if (error) {
          return reject(error);
        }
        return resolve(response);
      });
    });
  },
  async genHash(preimage) {
    const hash = crypto.createHash('sha256').update(preimage).digest('hex');
    return hash;
  },
};

module.exports = lndService;
