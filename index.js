console.log("Clear Console \n Start...");
process.stdout.write("\033c");

const spot = require("./services/spot");
spot.init();

process.on("SIGTERM", async function () {
  console.log("SIGTERM closing");
  await spot.exit(() => process.exit(0));
});

process.on("SIGINT", async function () {
  console.log("SIGINT closing");
  await spot.exit(() => process.exit(0));
});
