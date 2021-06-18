const { CancelAllPendingOrders } = require("../controllers/client");
const {
  initOrderbook,
  maintainOrderbook,
} = require("../controllers/orderbook");
const { sleep } = require("../utils/misc/sleep");

exports.init = async () => {
  console.log("Init");
  // Start Fresh = Delete all Pending Orders
  console.log("--------------------------");
  await CancelAllPendingOrders();
  console.log("--------------------------");
  await initOrderbook();
  console.log("----------------");
  runMaintainer();
};

const runMaintainer = async () => {
  await sleep(Number(process.env.SPEED));
  await maintainOrderbook();
  runMaintainer();
  console.log("----------------");
};

exports.exit = async (cb) => {
  await CancelAllPendingOrders();
  cb();
};
