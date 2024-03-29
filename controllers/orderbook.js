require("dotenv").config();
const BigNumber = require("bignumber.js");
const { getTokenBalances } = require("../utils/balance");
const { sleep } = require("../utils/misc/sleep");
const { logPrint } = require("../utils/misc/log");
// const { getLatestPrice, getUSDPrice } = require("../utils/price")(
//   process.env.PRICE_PROVIDER // pool / coingecko/livecoinwatch/uniswap
// );
const { getLatestPrice, getUSDPrice } = require("../utils/price")("pool");
const trade = require("./trade");
const { getMarketData, getOrder, cancelOrder } = require("./client");

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
const spread = process.env.SPREAD;
const priceGap = process.env.PRICE_GAP;
const orderBookLength = process.env.MAX_ORDERBOOK_LENGTH;
const expandInventory = process.env.EXPAND_INVENTORY;
const marketID = `${process.env.BASE_SYMBOL}-${process.env.QUOTE_SYMBOL}`;

const postTrade = async (price, amount, side) => {
  let message;

  try {
    if (side === "buy") {
      process.stdout.write(
        `Buy  | Price : ${price} | Amount : ${amount} | Status : `
      );
    } else {
      process.stdout.write(
        `Sell | Price : ${price} | Amount : ${amount} | Status : `
      );
    }

    await trade(
      process.env.PRIVATE_KEY,
      price,
      amount,
      side,
      "limit",
      marketID,
      side === "buy" ? openOrders.bids : openOrders.asks
    );
  } catch (msg1) {
    message = msg1;
    console.log(msg1);

    if (msg1 != "success") {
      console.log("Will Retry this one...");
      // try the trade again with 10% lower amount
      try {
        amount = (amount * 0.9).toFixed(marketData.amountDecimals);

        if (side === "buy") {
          process.stdout.write(
            `Buy  | Price : ${price} | Amount : ${amount} | Status : `
          );
        } else {
          process.stdout.write(
            `Sell | Price : ${price} | Amount : ${amount} | Status : `
          );
        }

        await trade(
          process.env.PRIVATE_KEY,
          price,
          amount,
          side,
          "limit",
          marketID,
          side === "buy" ? openOrders.bids : openOrders.asks
        );
      } catch (msg2) {
        message = msg2;
        console.log(msg2);
      }
    }
  }

  return message;
};

const generateAmountLadder = (balance) => {
  // console.log("balance = ", balance.toNumber());
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

  var total = new BigNumber(0);
  xs.forEach((x) => (total = total.plus(x)));

  var scale = new BigNumber(balance).dividedBy(total);

  var result = xs.map((x) => new BigNumber(x).multipliedBy(scale));

  const newResult = result.map((r) => r.toNumber());
  return newResult;
};

const generatePriceLadder = (remotePrice, side) => {
  var price = remotePrice;

  var xs = [];
  for (let i = 0; i < orderBookLength; i++) {
    let thisPrice;
    let step;

    // spread
    if (i == 0 && spread) {
      logPrint("Using Spread");
      step = new BigNumber(spread).dividedBy(2).toNumber();
    } else {
      step = priceGap;
    }

    if (side === "SELL")
      thisPrice = price.multipliedBy(new BigNumber(1).plus(step));
    else thisPrice = price.dividedBy(new BigNumber(1).plus(step));

    xs[i] = thisPrice;
    price = thisPrice;
  }

  const newResult = xs.map((r) => r.toNumber());
  return newResult;
};

const generateLadder = (remotePrice) => {
  /* ---------------------------- Generate Sell Side --------------------------- */
  let askAmountArray = generateAmountLadder(baseBalance).reverse();
  let askPriceArray = generatePriceLadder(remotePrice, "SELL").reverse();

  let askArray = [];
  for (let i = 0; i < orderBookLength; i++) {
    let ask = {
      price: askPriceArray[i],
      amount: askAmountArray[i],
    };
    askArray[i] = ask;
  }

  /* --------------------------- Generate Buy Side --------------------------- */
  let bidAmountArray = generateAmountLadder(quoteBalance);
  // let bidPriceArray = generatePriceLadder(remotePrice, "BUY");
  let bidPriceArray = generatePriceLadder(
    new BigNumber(askPriceArray[askPriceArray.length - 1]),
    "BUY"
  );

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

  // console.log(balances);
  // console.log("Base Balance =", balances.base.toNumber());
  // console.log("Quote Balance =", balances.quote.toNumber());

  if (balances.base.toNumber() == 0) {
    console.log("Error: Base Balance is 0");
    process.exit(0);
  }
  if (balances.quote.toNumber() == 0) {
    console.log("Error: Quote Balance is 0");
    process.exit(0);
  }

  // Will use 95% balance at start
  baseBalance = balances.base.multipliedBy(0.95);
  quoteBalance = balances.quote.multipliedBy(0.95);

  // get remote price
  let remotePrice;

  if (process.env.MANUAL_INIT_PRICE) {
    logPrint("Getting Mid Price By MANUAL_INIT_PRICE");
    remotePrice = new BigNumber(process.env.MANUAL_INIT_PRICE);
  } else {
    remotePrice = new BigNumber(await getLatestPrice());
  }

  if (!remotePrice) return;
  midPrice = remotePrice;

  ladder = generateLadder(remotePrice);
  console.table(ladder.asks);
  console.log(
    "================ " + remotePrice.toNumber() + " ================"
  );
  console.table(ladder.bids);

  // Create Sell Orders
  const asks = ladder.asks;
  for (i = 0; i < asks.length; i++) {
    let currentPrice = asks[i].price.toFixed(marketData.priceDecimals);
    let currentAmount = asks[i].amount.toFixed(marketData.amountDecimals);

    await postTrade(currentPrice, currentAmount, "sell");
  }

  // Create Buy Orders
  const bids = ladder.bids;
  for (i = 0; i < bids.length; i++) {
    let currentPrice = bids[i].price.toFixed(marketData.priceDecimals);
    let currentAmount = bids[i].amount.toFixed(marketData.amountDecimals);

    await postTrade(currentPrice, currentAmount, "buy");
  }
};

/* -------------------------------- Maintain -------------------------------- */

exports.maintainOrderbook = async () => {
  console.log("Maintenance Running");
  await rebuildOrders();

  // if (
  //   process.env.MAINTAIN_ARBITRAGE == "true" &&
  //   process.env.PRICE_PROVIDER !== "pool"
  // ) {
  //   logPrint("Lets Check Arbitrage Value...");
  //   let remotePrice = new BigNumber(await getLatestPrice());
  //   // let remotePrice = new BigNumber(0.053);

  //   if (!remotePrice) return;

  //   let percentChange = new BigNumber(
  //     remotePrice.minus(midPrice).dividedBy(remotePrice).multipliedBy(100)
  //   ).abs();

  //   console.log(`${percentChange.toNumber().toFixed(2)} % Arbitrage Available`);

  //   if (percentChange.isGreaterThan(Number(process.env.MAX_ARBITRAGE) * 100)) {
  //     console.log("Will Shift Orderbook to Global Price...");

  //     if (remotePrice.isGreaterThan(midPrice)) {
  //       logPrint("Want to Shift Up the price");
  //       await shiftUp(remotePrice);
  //     } else {
  //       logPrint("Want to Shift Down the price");
  //       await shiftDown(remotePrice);
  //     }
  //   } else {
  //     console.log("No Shifting Needed...");
  //   }
  // }
};

const rebuildOrders = async () => {
  let asks = openOrders.asks;
  let bids = openOrders.bids;

  // Check Sell Side - asks
  for (let i = asks.length - 1; i >= 0; i--) {
    let order = await getOrder(asks[i].orderId);

    if (order) {
      let filledAmount = new BigNumber(order.pendingAmount).plus(
        order.confirmedAmount
      );

      if (
        new BigNumber(order.availableAmount).isEqualTo(0) &&
        filledAmount.isGreaterThan(0)
      ) {
        // create Order
        console.log("Will Create New Buy Order");

        let result = await postTrade(asks[i].price, asks[i].amount, "buy");

        if (result == "success") {
          // sort Bids
          bids = openOrders.bids; // bid order was pushed in trade
          bids = bids.sort((a, b) => Number(b.price) - Number(a.price));

          // delete Ask
          asks = asks.filter((a) => a.orderId !== asks[i].orderId);
        }
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

      if (
        new BigNumber(order.availableAmount).isEqualTo(0) &&
        filledAmount.isGreaterThan(0)
      ) {
        // create Order
        console.log("Will Create New Sell Order");

        let result = await postTrade(bids[i].price, bids[i].amount, "sell");

        if (result == "success") {
          // // sort Asks
          // asks = openOrders.asks; // ask order was pushed in trade
          // asks = asks.sort((a, b) => Number(b.price) - Number(a.price));

          // delete Bid
          bids = bids.filter((a) => a.orderId !== bids[i].orderId);
          // bids = bids.filter((a) => a.orderId !== bids[i].orderId);
        }
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
};

// const shiftUp = async (remotePrice) => {
//   let asks = openOrders.asks;
//   let bids = openOrders.bids;

//   for (let i = orderBookLength - 1; i >= 0; i--) {
//     // if CenterPrice === Mid Price -> break;

//     let topBidPrice = new BigNumber(bids[0].price).multipliedBy(
//       new BigNumber(1).plus(priceGap)
//     );

//     if (topBidPrice.isGreaterThan(remotePrice)) {
//       logPrint("Shift Up Break...");
//       break;
//     } else {
//       // Cancel Last -> Create on Top

//       // Ask
//       let lastAsk = asks[asks.length - 1];
//       // delete Ask
//       await cancelOrder(lastAsk.orderId);

//       let topAsk = asks[0];
//       let thisAskPrice = new BigNumber(topAsk.price)
//         .multipliedBy(new BigNumber(1).plus(priceGap))
//         .toFixed(marketData.priceDecimals);
//       let thisAskAmount = topAsk.amount;
//       await postTrade(thisAskPrice, thisAskAmount, "sell");

//       asks = openOrders.asks; // bid order was pushed in trade
//       asks = asks
//         .filter((a) => a.orderId !== lastAsk.orderId)
//         .sort((a, b) => Number(b.price) - Number(a.price));

//       // Bid
//       let lastBid = bids[bids.length - 1];
//       // delete Bid
//       await cancelOrder(lastBid.orderId);

//       let topBid = bids[0];
//       let thisBidPrice = new BigNumber(topBid.price)
//         .multipliedBy(new BigNumber(1).plus(priceGap))
//         .toFixed(marketData.priceDecimals);
//       let thisBidAmount = topBid.amount;
//       await postTrade(thisBidPrice, thisBidAmount, "buy");

//       bids = openOrders.bids; // bid order was pushed in trade
//       bids = bids
//         .filter((b) => b.orderId !== lastBid.orderId)
//         .sort((a, b) => Number(b.price) - Number(a.price));
//     }

//     // finally save it
//     openOrders = {
//       asks: asks,
//       bids: bids,
//     };
//   }
// };

// const shiftDown = async (remotePrice) => {
//   let asks = openOrders.asks;
//   let bids = openOrders.bids;

//   for (let i = 0; i < orderBookLength; i++) {
//     // if CenterPrice === Mid Price -> break;

//     let lastAskPrice = new BigNumber(asks[asks.length - 1].price).dividedBy(
//       new BigNumber(1).plus(priceGap)
//     );

//     if (lastAskPrice.isLessThan(remotePrice)) {
//       console.log("Shift Down Break...");
//       break;
//     } else {
//       // Cancel Last -> Create on Top

//       // Bid
//       let topBid = bids[0];
//       // delete Bid
//       await cancelOrder(topBid.orderId);

//       let lastBid = bids[bids.length - 1];
//       let thisBidPrice = new BigNumber(lastBid.price)
//         .dividedBy(new BigNumber(1).plus(priceGap))
//         .toFixed(marketData.priceDecimals);
//       let thisBidAmount = lastBid.amount;
//       await postTrade(thisBidPrice, thisBidAmount, "buy");

//       bids = openOrders.bids; // bid order was pushed in trade
//       bids = bids
//         .filter((b) => b.orderId !== topBid.orderId)
//         .sort((a, b) => Number(b.price) - Number(a.price));

//       // Ask
//       let topAsk = asks[0];
//       // delete Ask
//       await cancelOrder(topAsk.orderId);

//       let lastAsk = asks[asks.length - 1];
//       let thisAskPrice = new BigNumber(lastAsk.price)
//         .dividedBy(new BigNumber(1).plus(priceGap))
//         .toFixed(marketData.priceDecimals);
//       let thisAskAmount = lastAsk.amount;
//       await postTrade(thisAskPrice, thisAskAmount, "sell");

//       asks = openOrders.asks; // bid order was pushed in trade
//       asks = asks
//         .filter((a) => a.orderId !== topAsk.orderId)
//         .sort((a, b) => Number(b.price) - Number(a.price));
//     }

//     // finally save it
//     openOrders = {
//       asks: asks,
//       bids: bids,
//     };
//   }

//   midPrice = remotePrice;
// };
