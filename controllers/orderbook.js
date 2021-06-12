require("dotenv").config();
const BigNumber = require("bignumber.js");
const { getTokenBalances } = require("../utils/balance");
const { sleep } = require("../utils/misc/sleep");
const { getLatestPrice, getUSDPrice } = require("../utils/price")(
  process.env.PRICE_PROVIDER
);
const trade = require("./trade");
const { getMarketData, getOrder } = require("./client");

var ladder;
var openOrders = {
  asks: [],
  bids: [],
};
var baseBalance;
var quoteBalance;
var availableBaseBalance;
var availableQuoteBalance;
var midPrice;
var marketData;
const step = process.env.ORDER_STEP;
const orderBookLength = process.env.MAX_ORDERBOOK_LENGTH;
const expandInventory = process.env.EXPAND_INVENTORY;
const marketID = `${process.env.BASE_SYMBOL}-${process.env.QUOTE_SYMBOL}`;

const generateAmountLadder = (balance) => {
  var xs = [];
  let amount = 1;

  for (let i = 0; i < orderBookLength; i++) {
    let value;

    value = new BigNumber(amount).multipliedBy(
      new BigNumber(1).plus(expandInventory)
    );

    xs[i] = value;
    amount = value;
  }
  // console.log(xs);

  var total = new BigNumber(0);
  xs.forEach((x) => (total = total.plus(x)));
  // console.log(total);

  var scale = new BigNumber(balance).dividedBy(total);

  var result = xs.map((x) => new BigNumber(x).multipliedBy(scale));
  // console.log(result);
  // return result;

  const newResult = result.map((r) => r.toNumber());
  return newResult;
};

const generatePriceLadder = (centerPrice, side) => {
  var price = centerPrice;
  var xs = [];
  for (let i = 0; i < orderBookLength; i++) {
    let thisPrice;
    if (side === "SELL")
      thisPrice = price.multipliedBy(new BigNumber(1).plus(step));
    else thisPrice = price.dividedBy(new BigNumber(1).plus(step));

    xs[i] = thisPrice;
    price = thisPrice;
  }

  //   console.log(xs);
  //   return xs

  const newResult = xs.map((r) => r.toNumber());
  return newResult;
};

const generateLadder = (centerPrice) => {
  /* ---------------------------- Generate Sell Side --------------------------- */
  let askAmountArray = generateAmountLadder(baseBalance).reverse();
  let askPriceArray = generatePriceLadder(centerPrice, "SELL").reverse();

  let askArray = [];
  for (let i = 0; i < orderBookLength; i++) {
    let ask = {
      price: askPriceArray[i],
      amount: askAmountArray[i],
    };
    askArray[i] = ask;
  }
  // console.table(askArray);

  console.log(
    "================ " + centerPrice.toNumber() + " ================"
  );

  /* --------------------------- Generate Buy Side --------------------------- */
  let bidAmountArray = generateAmountLadder(quoteBalance);
  let bidPriceArray = generatePriceLadder(centerPrice, "BUY");

  let bidArray = [];
  for (let i = 0; i < orderBookLength; i++) {
    let bid = {
      price: bidPriceArray[i],
      amount: bidAmountArray[i] / bidPriceArray[i],
    };
    bidArray[i] = bid;
  }
  // console.table(bidArray);

  return {
    asks: askArray,
    bids: bidArray,
  };
};

exports.initOrderbook = async () => {
  //get Market Data - Precisions
  marketData = await getMarketData();

  // Get Base + Quote Token Balance
  const balances = await getTokenBalances();
  baseBalance = balances.base;
  quoteBalance = balances.quote;

  // get remote price
  let centerPrice = new BigNumber(await getLatestPrice());
  if (!centerPrice) return;
  midPrice = centerPrice;

  ladder = generateLadder(centerPrice);
  console.log(ladder);

  // Create Sell Orders
  const asks = ladder.asks;
  for (i = 0; i < asks.length; i++) {
    let currentPrice = asks[i].price.toFixed(marketData.priceDecimals);
    let currentAmount = asks[i].amount.toFixed(marketData.amountDecimals);

    try {
      process.stdout.write(
        `Sell | Price : ${currentPrice} | Amount : ${currentAmount} | Status : `
      );
      await trade(
        process.env.PRIVATE_KEY,
        currentPrice,
        currentAmount,
        "sell",
        "limit",
        marketID,
        openOrders.asks
      );
    } catch (msg) {
      console.log(msg);
    }
  }

  // Create Buy Orders
  const bids = ladder.bids;
  for (i = 0; i < bids.length; i++) {
    let currentPrice = bids[i].price.toFixed(marketData.priceDecimals);
    let currentAmount = bids[i].amount.toFixed(marketData.amountDecimals);

    try {
      process.stdout.write(
        `Buy  | Price : ${currentPrice} | Amount : ${currentAmount} | Status : `
      );
      await trade(
        process.env.PRIVATE_KEY,
        currentPrice,
        currentAmount,
        "buy",
        "limit",
        marketID,
        openOrders.bids
      );
    } catch (msg) {
      console.log(msg);
    }
  }
};

/* -------------------------------- Maintain -------------------------------- */

exports.maintainOrderbook = async () => {
  console.log("Looping");

  // console.log(openOrders);
  let asks = openOrders.asks;
  let bids = openOrders.bids;

  // Check Sell Side - asks
  for (let i = asks.length - 1; i >= 0; i--) {
    let order = await getOrder(asks[i].orderId);

    if (order) {
      let filledAmount = new BigNumber(order.pendingAmount).plus(
        order.confirmedAmount
      );

      console.log("Asks ", order.availableAmount, filledAmount.toNumber());

      if (
        new BigNumber(order.availableAmount).isEqualTo(0) &&
        filledAmount.isGreaterThan(0)
      ) {
        // create Order
        console.log("Will Create New Buy Order");

        // let currentPrice = asks[i].price.toFixed(marketData.priceDecimals);
        // let currentAmount = asks[i].amount.toFixed(marketData.amountDecimals);

        let currentPrice = asks[i].price;
        let currentAmount = asks[i].amount;

        try {
          process.stdout.write(
            `Buy  | Price : ${currentPrice} | Amount : ${currentAmount} | Status : `
          );
          await trade(
            process.env.PRIVATE_KEY,
            currentPrice,
            currentAmount,
            "buy",
            "limit",
            marketID,
            openOrders.bids
          );
        } catch (msg) {
          console.log(msg);
        }

        // add Bid
        // bids = bids.sort((a, b) => b.price - a.price);

        // delete Ask
        asks = asks.filter((a) => a.orderId !== asks[i].orderId);
        // asks = asks.filter((a) => a.orderId !== asks[i].orderId);
      } else {
        break;
      }
    }
  }

  // Check Buy Side - bids
  for (let i = 0; i < bids.length; i++) {
    let order = await getOrder(bids[i].orderId);

    if (order) {
      let filledAmount = new BigNumber(order.pendingAmount).plus(
        order.confirmedAmount
      );

      console.log("Bids ", order.availableAmount, filledAmount.toNumber());

      if (
        new BigNumber(order.availableAmount).isEqualTo(0) &&
        filledAmount.isGreaterThan(0)
      ) {
        // create Order
        console.log("Will Create New Sell Order");

        // let currentPrice = bids[i].price.toFixed(marketData.priceDecimals);
        // let currentAmount = bids[i].amount.toFixed(marketData.amountDecimals);

        let currentPrice = bids[i].price;
        let currentAmount = bids[i].amount;

        try {
          process.stdout.write(
            `Sell | Price : ${currentPrice} | Amount : ${currentAmount} | Status : `
          );
          await trade(
            process.env.PRIVATE_KEY,
            currentPrice,
            currentAmount,
            "sell",
            "limit",
            marketID,
            openOrders.asks
          );
        } catch (msg) {
          console.log(msg);
        }

        // add Ask
        asks = asks.sort((a, b) => b.price - a.price);

        // delete Bid
        bids = bids.filter((a) => a.orderId !== bids[i].orderId);
        // bids = bids.filter((a) => a.orderId !== bids[i].orderId);
      } else {
        break;
      }
    }
  }

  // finally save it
  openOrders = {
    asks: asks,
    bids: bids,
  };
  console.log("----------------");
};
