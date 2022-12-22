const lndService = require('./lndService');
require('dotenv').config();

getinfo();

async function getinfo() {
  const info = await lndService.getInfo();
  console.log(info);
}