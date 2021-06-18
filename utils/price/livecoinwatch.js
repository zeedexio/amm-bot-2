require("dotenv").config();
const axios = require("axios");

var gPrice;
var gUSDPrice;

const httpClient = axios.create();
httpClient.defaults.timeout = 5000;

const getLatestPrice = async () => {
  try {
    let baseSymbol = process.env.BASE_SYMBOL.toUpperCase();
    let quoteSymbol = process.env.QUOTE_SYMBOL.toUpperCase();

    let baseRate;
    let quoteRate;

    // Base Price
    const baseReq = await axios.post(
      `https://api.livecoinwatch.com/coins/single`,
      {
        currency: "USD",
        code: baseSymbol,
        meta: false,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.LIVECOINWATCH_API_KEY,
        },
      }
    );
    if (baseReq.error) console.log(baseReq.error);
    baseRate = baseReq.data.rate;

    // Quote Price
    if (quoteSymbol === "USDT" || quoteSymbol === "USDC") {
      quoteRate = 1;
    } else {
      // wrapped token
      if (quoteSymbol.length > 3 && quoteSymbol.startsWith("W")) {
        quoteSymbol = quoteSymbol.slice(1);
      }

      const quoteReq = await axios.post(
        `https://api.livecoinwatch.com/coins/single`,
        {
          currency: "USD",
          code: quoteSymbol,
          meta: false,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.LIVECOINWATCH_API_KEY,
          },
        }
      );
      if (quoteReq.error) console.log(quoteReq.error);
      quoteRate = quoteReq.data.rate;
    }

    gPrice = (1 / quoteRate) * baseRate;
  } catch (err) {
    console.log(err);
  }
  return gPrice;
};

const getUSDPrice = async () => {
  let baseSymbol = process.env.BASE_SYMBOL.toUpperCase();
  try {
    if (baseSymbol != "USDT" && baseSymbol != "USD") {
      const response = await axios.post(
        `https://api.livecoinwatch.com/coins/single`,
        {
          currency: "USD",
          code: baseSymbol,
          meta: false,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.LIVECOINWATCH_API_KEY,
          },
        }
      );
      let tokenPrice = response.data.rate;
      gUSDPrice = tokenPrice;
    } else {
      gUSDPrice = 1;
    }
  } catch (err) {
    console.log(err);
  }
  return gUSDPrice;
};

module.exports = { getLatestPrice, getUSDPrice };
