require("dotenv").config();
const axios = require("axios");
const getAuthToken = require("../utils/auth");
const { sleep } = require("../utils/misc/sleep");

const getPendingOrders = async (marketID) => {
  var pendingOrders = [];
  var pageNum = 0;

  while (true) {
    try {
      let req = await axios({
        method: "GET",
        url: `${process.env.DEX_API_URL}/orders?marketID=${marketID}&perPage=100&status=pending&page=${pageNum}`,
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
      if (res && res.desc == "success") {
        //  pendingOrders = res.data.orders;
        // pendingOrders.push(res.data.orders);
        pendingOrders = pendingOrders.concat(res.data.orders);
      } else {
        throw "Error Fetching Pending Orders";
      }

      if (pendingOrders.length >= res.data.count) {
        break;
      } else {
        pageNum = pageNum + 1;
      }
    } catch (error) {
      throw error;
    }
  }

  return pendingOrders;

  // console.log(await getAuthToken("0x" + process.env.PRIVATE_KEY));
};

exports.cancelOrder = async (orderID) => {
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
    console.log("Cancel Order Errored : ", error.message);
    return { status: 404 };
  }
};

exports.CancelAllPendingOrders = async () => {
  console.log("Going to Cancel All Pending Orders");
  const marketID = `${process.env.BASE_SYMBOL}-${process.env.QUOTE_SYMBOL}`;

  const pendingOrders = await getPendingOrders(marketID);

  console.log(
    `Found ${pendingOrders ? pendingOrders.length : 0} Pending Orders`
  );

  if (pendingOrders && pendingOrders.length > 0) {
    for (let i = 0; i < pendingOrders.length; i++) {
      const deleteThis = await this.cancelOrder(pendingOrders[i].id);

      if (deleteThis.status === 0) {
        // console.log("Deleted Order - ", pendingOrders[i].id);
        console.log("Deleted Order # - ", i);
      } else {
        console.log("Some problem in deleting Order ", pendingOrders[i].id);
      }
      //   console.log(deleteThis);
    }
  } else {
    console.log("Nothing to Delete...");
  }
};

exports.getMarketData = async () => {
  const marketID = `${process.env.BASE_SYMBOL}-${process.env.QUOTE_SYMBOL}`;

  try {
    let req = await axios({
      method: "GET",
      url: `${process.env.DEX_API_URL}/markets/${marketID}`,
      timeout: 20000,
    });
    // console.log(ret)

    let res = req.data;

    if (res && res.status == 0) {
      return res.data.market;
    } else {
      return;
    }
  } catch (error) {
    console.log("Get Market Error :", error.message);
    return { status: 404 };
  }
};

/* ----------------------------- Maintain Orders ---------------------------- */

exports.getOrder = async (orderID) => {
  try {
    let ret = await axios({
      method: "GET",
      url: `${process.env.DEX_API_URL}/orders/${orderID}`,
      timeout: 20000,
      headers: {
        "Zeedex-Authentication": await getAuthToken(
          "0x" + process.env.PRIVATE_KEY
        ),
      },
    });
    const res = ret.data;

    if (res.status == 0) {
      return res.data.order;
    } else {
      return {};
    }
  } catch (error) {
    console.log("Cancel Order Errored : ", error.message);
    return { status: 404 };
  }
};
