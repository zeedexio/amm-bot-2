const Coingecko = require("./coingecko");
const Livecoinwatch = require("./livecoinwatch");
const Pool = require("./pool");
// const Uniswap = require("./uniswap");

module.exports = (priceProvider = "coingecko", p = false) => {
  switch (priceProvider) {
    case "coingecko":
      return Coingecko;
    case "livecoinwatch":
      return Livecoinwatch;
    case "pool":
      return Pool;
    // case "uniswap":
    //   return Uniswap;
    default:
      return Coingecko;
  }
};
