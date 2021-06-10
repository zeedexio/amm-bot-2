const BigNumber = require("bignumber.js");
const { getLatestPrice, getUSDPrice } = require("../utils/price")(
  process.env.PRICE_PROVIDER
);
const { getTokenBalances } = require("../utils/balance");

var ladder;
var baseBalance;
var quoteBalance;
var availableBaseBalance;
var availableQuoteBalance;
var midPrice;
const step = process.env.ORDER_STEP;
const orderBookLength = process.env.MAX_ORDERBOOK_LENGTH;
const expandInventory = process.env.EXPAND_INVENTORY;

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
  // console.log(askAmountArray);

  let askPriceArray = generatePriceLadder(centerPrice, "SELL").reverse();
  //   console.log(askPriceArray);

  let askArray = [];
  for (let i = 0; i < orderBookLength; i++) {
    let ask = {
      price: askPriceArray[i],
      amount: askAmountArray[i],
    };
    // console.log(ask.price, ask.amount);
    askArray[i] = ask;
  }
  // console.table(askArray);

  console.log(
    "================ " + centerPrice.toNumber() + " ================"
  );

  /* --------------------------- Generate Buy Side --------------------------- */
  let bidAmountArray = generateAmountLadder(quoteBalance);
  //   console.log(bidAmountArray);

  let bidPriceArray = generatePriceLadder(centerPrice, "BUY");
  //   console.log(bidPriceArray);

  let bidArray = [];
  for (let i = 0; i < orderBookLength; i++) {
    let bid = {
      price: bidPriceArray[i],
      amount: bidAmountArray[i] / bidPriceArray[i],
    };
    //  console.log(bid.price, bid.amount);
    bidArray[i] = bid;
  }
  // console.table(bidArray);

  return {
    asks: askArray,
    bids: bidArray,
  };
};

exports.initOrderbook = async () => {
  // Get Base + Quote Token Balance
  const balances = await getTokenBalances();
  baseBalance = balances.base;
  quoteBalance = balances.quote;

  // get remote price
  let centerPrice = new BigNumber(await getLatestPrice());
  midPrice = centerPrice;

  ladder = generateLadder(centerPrice);
  console.log(ladder);

  // Create Sell Orders

  // Create Buy Orders
};
