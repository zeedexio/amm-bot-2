require("dotenv").config();
const axios = require("axios");
const BigNumber = require("bignumber.js");
const { getTokenBalances } = require("../balance");
const { logPrint } = require("../misc/log");

var gPrice;
var gUSDPrice;

const httpClient = axios.create();
httpClient.defaults.timeout = 5000;

const getLatestPrice = async () => {
  try {
    let baseSymbol = process.env.BASE_SYMBOL.toUpperCase();
    let quoteSymbol = process.env.QUOTE_SYMBOL.toUpperCase();

    // Get Orderbook
    const orderbookReq = await axios.get(
      `${process.env.DEX_API_URL}/markets/${baseSymbol}-${quoteSymbol}/orderbook`
    );

    let orderBookData = orderbookReq.data.data.orderBook;

    let bestAsk =
      orderBookData.asks.length > 0
        ? new BigNumber(orderBookData.asks[0][0])
        : null;
    let bestBid =
      orderBookData.bids.length > 0
        ? new BigNumber(orderBookData.bids[0][0])
        : null;

    if (orderBookData && bestAsk && bestBid) {
      logPrint("Got Orderbook");
      gPrice = new BigNumber(bestAsk).plus(bestBid).dividedBy(2).toNumber();
    } else {
      gPrice = await getPriceByBalance();
    }
  } catch (err) {
    console.log("Can not get price from orderbook data");
    gPrice = await getPriceByBalance();
  }
  return gPrice;
};

const getPriceByBalance = async () => {
  logPrint("Getting Mid Price By Balance");
  // Get Balance, if no orderbook
  const balances = await getTokenBalances();
  let baseBalance = balances.base;
  let quoteBalance = balances.quote;

  return new BigNumber(quoteBalance).dividedBy(baseBalance).toNumber();
};

module.exports = { getLatestPrice };
