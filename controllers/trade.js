const axios = require("axios");

const getAuthToken = require("../utils/auth");
const signOrder = require("../utils/auth/signOrder");

module.exports = async (privKey, price, amount, side, orderType, marketId) => {
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
      // console.log("orderId = ", orderId);

      const signature = await signOrder("0x" + privKey, orderId);
      // console.log("signature = ", signature);

      // let message = "ZEEDEX-AUTHENTICATION" + Date.now();
      // let token = getAuthToken("0x" + privKey);
      // let tokens = (await token).split("#");
      // tokens[1] = message;
      // let finalToken = tokens[0] + "#" + tokens[1] + "#" + tokens[2];
      // console.log(finalToken);

      // console.log(finalToken);
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
