const lndService = require('./lndService');
require('dotenv').config();

getinfo();

// Uncomment below to get an invoice.
//main();

async function getinfo() {
  const info = await lndService.getInfo();
  console.log(`DH Server: ${info.uris}`);
}

async function main() {
  // Get an invoice
  const invoice = await lndService.addInvoice(1000,"This is test");
  // Pay this invoice so that the server closes this stream.
  // You can paste and pay this invoice at https://htlc.me
  console.log(invoice.payment_request)
  // Subscribe an invoice
  lndService.subscribeSingleInvoice(invoice.r_hash);
}