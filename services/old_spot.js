const BigNumber = require("bignumber.js");
const { CancelAllPendingOrders } = require("../controllers/client");
const { getLatestPrice, getUSDPrice } = require("../utils/price")(
  process.env.PRICE_PROVIDER
);
const { getTokenBalances } = require("../utils/balance");

const generateLadder = async (
  baseTokenAmount,
  quoteTokenAmount,
  minPrice,
  maxPrice,
  priceGap,
  expandInventory
) => {
  let ladders = [];

  // product
  let product = baseTokenAmount.multipliedBy(quoteTokenAmount);

  // get remote price
  // let centerPrice = new BigNumber(await getLatestPrice());
  let centerPrice = quoteTokenAmount.dividedBy(baseTokenAmount);
  // let centerPrice = new BigNumber(10);

  console.log("--------------------------");
  console.log("priceGap = ", priceGap);
  console.log("baseTokenAmount = ", baseTokenAmount);
  console.log("quoteTokenAmount = ", quoteTokenAmount);
  console.log(`${centerPrice} ${process.env.QUOTE_SYMBOL}`);
  console.log("--------------------------");

  var upPrice;
  var downPrice;
  var lastBaseAmount;

  // ask Orders
  downPrice = centerPrice;
  lastBaseAmount = baseTokenAmount;
  while (true) {
    upPrice = downPrice.multipliedBy(new BigNumber(1).plus(priceGap));

    if (upPrice.isGreaterThan(maxPrice)) {
      console.log(upPrice.toNumber(), " break ", maxPrice);
      break;
    }

    let f = product.dividedBy(upPrice);
    let newBaseAmount = new BigNumber(parseFloat(Math.sqrt(f)));

    let inventoryValueAsk = newBaseAmount
      .minus(lastBaseAmount)
      .absoluteValue()
      .multipliedBy(expandInventory);

    // inventoryValueAsk = new BigNumber(10);

    // console.log(
    //   f.toNumber(),
    //   newBaseAmount.toNumber(),
    //   inventoryValueAsk.toNumber()
    // );

    console.log(
      "upPrice = ",
      upPrice.toNumber(),
      " = ",
      inventoryValueAsk.toNumber()
    );

    ladders.push({
      upPrice,
      downPrice,
      inventoryValueAsk,
    });
    downPrice = upPrice;
    lastBaseAmount = newBaseAmount;
  }

  // let value = 0;
  // for (let i = 0; i < ladders.length; i++) {
  //   value = Number(value) + Number(ladders[i].inventoryValueAsk);
  // }
  // console.log(value);

  // bid Orders
  upPrice = centerPrice;
  lastBaseAmount = baseTokenAmount;
  while (true) {
    downPrice = upPrice.dividedBy(new BigNumber(1).plus(priceGap));
    if (downPrice.isLessThan(minPrice)) {
      console.log(downPrice.toNumber(), " break ", minPrice);
      break;
    }
    let f = product.dividedBy(downPrice);
    let newBaseAmount = new BigNumber(parseFloat(Math.sqrt(f)));

    let inventoryValueBid = newBaseAmount
      .minus(lastBaseAmount)
      .absoluteValue()
      .multipliedBy(expandInventory);

    console.log(
      "downPrice = ",
      downPrice.toNumber(),
      " = ",
      inventoryValueBid.toNumber()
    );

    ladders.push({
      upPrice,
      downPrice,
      inventoryValueBid,
    });
    upPrice = downPrice;
    lastBaseAmount = newBaseAmount;
  }

  return ladders;
};

const initOrderbook = async () => {
  // Get Base + Quote Token Balance
  const balances = await getTokenBalances();
  // console.log(balances);

  // get remote price
  let centerPrice = new BigNumber(await getLatestPrice());

  let totalBaseValue = new BigNumber(balances.base.multipliedBy(centerPrice));
  let totalQuoteValue = new BigNumber(balances.quote);

  let usingInitBase;
  let usingInitQuote;
  if (totalBaseValue > totalQuoteValue) {
    usingInitBase = totalQuoteValue.dividedBy(centerPrice);
    usingInitQuote = balances.quote;
    console.log(
      "Left Over Base = ",
      balances.base.minus(usingInitBase).toNumber()
    );
  } else {
    usingInitBase = balances.base;
    usingInitQuote = balances.base.multipliedBy(centerPrice);
    console.log(
      "Left Over Quote = ",
      balances.quote.minus(usingInitQuote).toNumber()
    );
  }

  console.log(usingInitBase.toNumber(), usingInitQuote.toNumber());

  const equalBase = balances.quote.dividedBy(centerPrice);

  let ladders = await generateLadder(
    usingInitBase,
    usingInitQuote,
    0.0325,
    0.13,
    process.env.ORDER_STEP,
    process.env.EXPAND_INVENTORY
  );
  // console.log(ladders);

  //// SOMETHING

  //   //   // get remote price
  //   let remotePrice = parseFloat(await getLatestPrice());
  //   console.log(`${remotePrice} ${process.env.QUOTE_SYMBOL}`);
  //   // get remote usd price
  //   let usdPrice = parseFloat(await getUSDPrice());
  //   console.log(`${usdPrice} USD`);
  //   let step = process.env.ORDER_STEP;
  //   startingBuyPrice = remotePrice * (1 - step);
  //   startingSellPrice = remotePrice * (1 + step);
  //   console.log(startingSellPrice, " = ", remotePrice, " = ", startingBuyPrice);
  //   // create sell side
  //   // create buy side
};

exports.init = async () => {
  console.log("Init");
  // Start Fresh = Delete all Pending Orders
  console.log("--------------------------");
  await CancelAllPendingOrders();
  console.log("--------------------------");

  initOrderbook();
};
