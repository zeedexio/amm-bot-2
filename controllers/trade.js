const axios = require("axios");

const getToken = require("../Utils/getToken");
const signOrder = require("../Utils/signOrder");

const URL_BUILD = "https://test-api.zeedex.io/orders/build";
const URL_PLACE = "https://test-api.zeedex.io/orders";
const URL_TICKER = "https://test-api.zeedex.io/tickers/";

module.exports = async (
  privKey,
  amount,
  side,
  orderType,
  marketId,
  limitOrders
) => {
  return new Promise(async (resolve, reject) => {
    let price;

    if (orderType === "market") {
      price = 0;
    } else {
      const resultTicker = await axios.get(`${URL_TICKER}${marketId}`);
      // if (side === "sell") {
      //   price =
      //     parseFloat(resultTicker.data.data.ticker.bid) +
      //     parseFloat(resultTicker.data.data.ticker.bid) * 0.05;
      // } else if (side === "buy") {
      //   price =
      //     parseFloat(resultTicker.data.data.ticker.ask) -
      //     parseFloat(resultTicker.data.data.ticker.ask) * 0.05;
      // }
      price = 0.021;
    }

    price = price.toFixed(6);

    try {
      const resultBuild = await axios.post(
        URL_BUILD,
        {
          amount,
          price,
          side,
          orderType,
          marketId,
        },
        {
          headers: {
            "Zeedex-Authentication": await getToken("0x" + privKey),
          },
        }
      );

      if (resultBuild.data.data === undefined) {
        reject(resultBuild.data.desc);
        return;
      }

      const orderId = resultBuild.data.data.order.id;
      console.log("orderId = ", orderId);

      if (orderType === "limit") {
        limitOrders.push({
          privKey,
          orderId,
          amount,
          price,
          side,
          orderType,
          marketId,
          time: Date.now(),
        });
      }

      const signature = await signOrder("0x" + privKey, orderId);
      console.log("signature = ", signature);

      const resultPlace = await axios.post(
        URL_PLACE,
        {
          orderId,
          signature,
        },
        {
          headers: {
            "Zeedex-Authentication": getToken("0x" + privKey),
          },
        }
      );

      if (resultPlace.data.data === undefined) {
        reject(resultPlace.data.desc);
        return;
      }

      resolve(resultPlace.data.data.order);
    } catch (err) {
      reject(err);
    }
  });
};
