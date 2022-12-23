const lndService = require('./lndService');
require('dotenv').config();

getinfo();

// Uncomment below to get an invoice.
// getInvoice();
// sendCoins();

async function getinfo() {
  const info = await lndService.getInfo();
  console.log(`DH Server: ${info.uris}`);
}

async function getInvoice() {
  // Get an invoice
  const invoice = await lndService.addInvoice(1000,"This is test");
  // Pay this invoice so that the server closes this stream.
  // You can paste and pay this invoice at https://htlc.me
  console.log(`Pay this invoice: ${invoice.payment_request}`);
  // Subscribe an invoice
  lndService.subscribeSingleInvoice(invoice.r_hash);
}

async function sendCoins() {
  const bitcoinAddress = 'tb1qqxa4m3w53jf29mj5z2e6pcxwkdcwrxxhcjda4n';
  const res = await lndService.sendCoins(bitcoinAddress, 1000,);
  console.log(`Sent coins to ${bitcoinAddress}. Txid: ${res.txid}`);
}