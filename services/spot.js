const { CancelAllPendingOrders } = require("../controllers/client");
const { initOrderbook } = require("../controllers/orderbook");
const { sleep } = require("../utils/misc/sleep");

const loop = () => {
  console.log("Looping");
  setTimeout(function () {
    loop();
  }, 3000);
};

exports.init = async () => {
  console.log("Init");
  // Start Fresh = Delete all Pending Orders
  console.log("--------------------------");
  await CancelAllPendingOrders();
  console.log("--------------------------");

  await initOrderbook();

  loop();
};

exports.exit = async (cb) => {
  await CancelAllPendingOrders();
  cb();
};
