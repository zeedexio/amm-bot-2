const { CancelAllPendingOrders } = require("../controllers/client");
const { initOrderbook } = require("../controllers/orderbook");

exports.init = async () => {
  console.log("Init");
  // Start Fresh = Delete all Pending Orders
  console.log("--------------------------");
  await CancelAllPendingOrders();
  console.log("--------------------------");

  initOrderbook();
};

exports.exit = async (cb) => {
  await CancelAllPendingOrders();
  cb();
};
