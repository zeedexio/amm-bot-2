const Web3 = require("web3");
const tokenABI = require("./abi");
const axios = require("axios");
const BigNumber = require("bignumber.js");
const { getMarketData } = require("../../controllers/market");

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL));
var currentMarket = {};

// const getMarketData = async () => {
//   const marketID = `${process.env.BASE_SYMBOL}-${process.env.QUOTE_SYMBOL}`;

//   try {
//     let req = await axios({
//       method: "GET",
//       url: `${process.env.DEX_API_URL}/markets/${marketID}`,
//       timeout: 20000,
//     });
//     // console.log(ret)
//     return req.data;
//   } catch (error) {
//     console.log("Get fiat price timeout:", error.message);
//     return { status: 404 };
//   }
// };

exports.getTokenBalances = async () => {
  const web3Account = web3.eth.accounts.privateKeyToAccount(
    "0x" + process.env.PRIVATE_KEY
  );
  let marketData = await getMarketData();

  let balances = {
    base: 0,
    quote: 0,
  };
  // console.log(marketData);

  // Base TOken
  var baseTokenContract = new web3.eth.Contract(
    tokenABI,
    marketData.baseTokenAddress
  );
  let baseBal = await baseTokenContract.methods
    .balanceOf(web3Account.address)
    .call()
    .then(function (bal) {
      //  console.log(bal);
      return bal;
    });
  balances.base = new BigNumber(baseBal).dividedBy(
    Math.pow(10, marketData.quoteTokenDecimals)
  );
  // .toNumber();

  // Quote TOken
  var quoteTokenContract = new web3.eth.Contract(
    tokenABI,
    marketData.quoteTokenAddress
  );
  let quoteBal = await quoteTokenContract.methods
    .balanceOf(web3Account.address)
    .call()
    .then(function (bal) {
      // console.log(bal);
      return bal;
    });
  balances.quote = new BigNumber(quoteBal).dividedBy(
    Math.pow(10, marketData.quoteTokenDecimals)
  );
  // .toNumber();

  return balances;
};
