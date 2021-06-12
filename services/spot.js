const { CancelAllPendingOrders } = require("../controllers/client");
const {
  initOrderbook,
  maintainOrderbook,
} = require("../controllers/orderbook");
const cron = require("node-cron");
const { sleep } = require("../utils/misc/sleep");

exports.init = async () => {
  console.log("Init");
  // Start Fresh = Delete all Pending Orders
  console.log("--------------------------");
  await CancelAllPendingOrders();
  console.log("--------------------------");

  await initOrderbook();

  // let seconds = Number(process.env.SPEED) / 1000;
  // cron.schedule(`*/${seconds} * * * * *`, async () => {
  //   await maintainOrderbook();
  // });
  runMaintainer();
};

const runMaintainer = async () => {
  await sleep(Number(process.env.SPEED));
  await maintainOrderbook();
  runMaintainer();
};

exports.exit = async (cb) => {
  await CancelAllPendingOrders();
  cb();
};
