const axios = require("axios");
const getAuthToken = require("../utils/auth");

const getPendingOrders = async (marketID) => {
  var pendingOrders;

  try {
    let req = await axios({
      method: "GET",
      url: `${process.env.DEX_API_URL}/orders?marketID=${marketID}`,
      timeout: 20000,

      headers: {
        "Zeedex-Authentication": await getAuthToken(
          "0x" + process.env.PRIVATE_KEY
        ),
      },
    });
    // console.log(res)
    // return res;

    const res = req.data;
    if (res && res.status == 0) {
      pendingOrders = res.data.orders;
    }
  } catch (error) {
    console.log("timeout:", error.message);
    // return { status: 404 };
    throw error;
  }

  return pendingOrders;

  // console.log(await getAuthToken("0x" + process.env.PRIVATE_KEY));
};

const cancelOrder = async (orderID) => {
  try {
    let ret = await axios({
      method: "DELETE",
      url: `${process.env.DEX_API_URL}/orders/${orderID}`,
      timeout: 20000,
      headers: {
        "Zeedex-Authentication": await getAuthToken(
          "0x" + process.env.PRIVATE_KEY
        ),
      },
    });
    // console.log(ret)
    return ret.data;
  } catch (error) {
    console.log("Get fiat price timeout:", error.message);
    return { status: 404 };
  }
};

exports.CancelAllPendingOrders = async () => {
  console.log("Going to Cancel All Pending Orders");
  const marketID = `${process.env.BASE_SYMBOL}-${process.env.QUOTE_SYMBOL}`;

  const pendingOrders = await getPendingOrders(marketID);
  // console.log(pendingOrders);

  console.log(
    `Found ${pendingOrders ? pendingOrders.length : 0} Pending Orders`
  );

  if (pendingOrders && pendingOrders.length > 0) {
    for (let i = 0; i < pendingOrders.length; i++) {
      const deleteThis = await cancelOrder(pendingOrders[i].id);

      if (deleteThis.status === 0) {
        console.log("Deleted Order - ", pendingOrders[i].id);
      } else {
        console.log("Some problem in deleting Order ", pendingOrders[i].id);
      }
      //   console.log(deleteThis);
    }
  } else {
    console.log("Nothing to Delete...");
  }
};
