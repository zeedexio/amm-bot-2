const axios = require("axios");

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
