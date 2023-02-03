const lndService = require('./lndService');
const crypto = require('crypto');
require('dotenv').config();

getinfo();

// Uncomment below to get an invoice.
// main();
// sendCoins();
//getInvoice();

const payment_hash = '2b30a0126221d30f7fd6f529722ff8d4cb27102cf4cb8b28708f89b35bf7fe40';
getInvoiceState(payment_hash);

async function getinfo() {
  const info = await lndService.getInfo();
  console.log(`DH Server: ${info.uris}`);
}

async function main() {
  // Get an invoice
  const invoice = await lndService.addInvoice(1000, 'This is test');
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

async function getInvoice() {
  // Store preimage and payment_hash in database to request 
  // settlement when 'Claim NFT' and 'Send BTC' are completed.
  const preimage = crypto.randomBytes(32);
  const payment_hash = await lndService.genHash(preimage);
  const holdinvoice = await lndService.addHoldInvoice(
    1000,
    'This is test',
    Buffer.from(payment_hash, 'hex'),
  );
  // This is just for test. Do not use global variables. 
  global.preimage = preimage;
  global.payment_hash = payment_hash;
  console.log(`preimage: ${preimage.toString('hex')}`);
  console.log(`payment_hash: ${payment_hash.toString('hex')}`);
  console.log(`Pay this invoice: ${holdinvoice.payment_request}`);
  // Subscribe an invoice
  lndService.subscribeSingleInvoice(Buffer.from(payment_hash, 'hex'));
}

async function getInvoiceState(payment_hash) {
  const invoice_state = await lndService.lookupInvoiceV2(Buffer.from(payment_hash, 'hex'));
  // InvoiceState: OPEN, SETTLED, CANCELED, ACCEPTED
  console.log(`invoice state: ${invoice_state.state}`);
}