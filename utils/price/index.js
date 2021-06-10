const Coingecko = require("./coingecko");
const Pool = require("./pool");
const Uniswap = require("./uniswap");

module.exports = (priceProvider = "coingecko", p = false) => {
  switch (priceProvider) {
    case "coingecko":
      return Coingecko;
    case "uniswap":
      return Uniswap;
    case "pool":
      Pool.init();
      return Pool;
    default:
      return Coingecko;
  }
};
