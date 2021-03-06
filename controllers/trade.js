require("dotenv").config();
const axios = require("axios");

const getAuthToken = require("../utils/auth");
const signOrder = require("../utils/auth/signOrder");

module.exports = async (
  privKey,
  price,
  amount,
  side,
  orderType,
  marketId,
  array
) => {
  return new Promise(async (resolve, reject) => {
    const token = await getAuthToken("0x" + privKey);

    try {
      const resultBuild = await axios.post(
        `${process.env.DEX_API_URL}/orders/build`,
        {
          amount,
          price,
          side,
          orderType,
          marketId,
        },
        {
          headers: {
            "Zeedex-Authentication": token,
          },
        }
      );

      if (resultBuild.data.data === undefined) {
        reject(resultBuild.data.desc);
        return;
      }

      const orderId = resultBuild.data.data.order.id;

      const signature = await signOrder("0x" + privKey, orderId);

      const resultPlace = await axios.post(
        `${process.env.DEX_API_URL}/orders`,
        {
          orderId,
          signature,
        },
        {
          headers: {
            "Zeedex-Authentication": token,
          },
        }
      );

      // add to the openOrders array
      if (resultPlace.data.status == 0) {
        array.push({
          orderId,
          amount,
          price,
        });
      }

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
