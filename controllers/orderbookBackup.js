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
  for (let i = 0; i < orderBookLength; i++) {
    let value = new BigNumber(1).plus(i * expandInventory);

    xs[i] = value;
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
    if (side === "BUY")
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
  /* --------------------------- Generate Sell Side --------------------------- */
  let bidAmountArray = generateAmountLadder(baseBalance).reverse();
  //   console.log(bidAmountArray);

  let bidPriceArray = generatePriceLadder(centerPrice, "BUY").reverse();
  //   console.log(bidPriceArray);

  let bidArray = [];
  for (let i = 0; i < orderBookLength; i++) {
    let bid = {
      price: bidPriceArray[i],
      amount: bidAmountArray[i],
    };
    //  console.log(bid.price, bid.amount);
    bidArray[i] = bid;
  }
  console.table(bidArray);

  console.log("================" + centerPrice.toNumber() + "================");

  /* ---------------------------- Generate Buy Side --------------------------- */
  let askAmountArray = generateAmountLadder(quoteBalance);
  // console.log(askAmountArray);

  let askPriceArray = generatePriceLadder(centerPrice, "SELL");
  //   console.log(askPriceArray);

  let askArray = [];
  for (let i = 0; i < orderBookLength; i++) {
    let ask = {
      price: askPriceArray[i],
      amount: askAmountArray[i] / askPriceArray[i],
    };
    // console.log(ask.price, ask.amount);
    bidArray[i] = ask;
  }
  console.table(bidArray);
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
};
