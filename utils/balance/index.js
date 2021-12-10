require("dotenv").config();
const Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL));
// var web3 = new Web3(process.env.RPC_URL);

const tokenABI = require("./abi");
const BigNumber = require("bignumber.js");
const { getMarketData } = require("../../controllers/client");

exports.getTokenBalances = async () => {
  const web3Account = web3.eth.accounts.privateKeyToAccount(
    "0x" + process.env.PRIVATE_KEY
  );
  let marketData = await getMarketData();

  let balances = {
    base: 0,
    quote: 0,
  };

  // Base TOken
  var baseTokenContract = new web3.eth.Contract(
    tokenABI,
    marketData.baseTokenAddress
  );
  let baseBal = await baseTokenContract.methods
    .balanceOf(web3Account.address)
    .call()
    .then(function (bal) {
      return bal;
    })
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });
  balances.base = new BigNumber(baseBal).dividedBy(
    Math.pow(10, marketData.baseTokenDecimals)
  );

  // Quote TOken
  var quoteTokenContract = new web3.eth.Contract(
    tokenABI,
    marketData.quoteTokenAddress
  );
  let quoteBal = await quoteTokenContract.methods
    .balanceOf(web3Account.address)
    .call()
    .then(function (bal) {
      return bal;
    })
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });
  balances.quote = new BigNumber(quoteBal).dividedBy(
    Math.pow(10, marketData.quoteTokenDecimals)
  );

  console.log("Base Balance =", balances.base.toNumber());
  console.log("Quote Balance =", balances.quote.toNumber());
  return balances;
};
