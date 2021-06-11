const { getEnvErrors } = require("./utils/process/env");
const { sleep } = require("./utils/misc/sleep");
const spot = require("./services/spot");

const startSpotBot = async () => {
  console.log("\nClearing Console...");
  await sleep(2000);
  process.stdout.write("\033c");
  spot.init();
};

const stopSpotBot = async (sig) => {
  if (typeof sig === "string") {
    // call your async task here and then call process.exit() after async task is done
    await spot.exit(function () {
      console.log("Received %s - terminating bot ...", sig);
      process.exit(1);
      process.exit(0);
    });
  }
  console.log("Process stopped, signal: " + sig + "\n");
};

/* ---------------------------- Start / Stop Bot ---------------------------- */
console.log("Start...");

console.log("Checking ENV Variables...");
const envErrors = getEnvErrors();
if (envErrors) {
  console.log("\x1b[31m%s\x1b[0m", envErrors.error); // red
  process.exit(0);
} else {
  console.log("\x1b[32m%s\x1b[0m", "All Seems Fine"); // red
  startSpotBot();
}

// catching signals and do something before exit
["SIGINT", "SIGTERM", "SIGQUIT"].forEach(function (sig) {
  process.on(sig, function () {
    console.log("\nClearing Console...");
    process.stdout.write("\033c");
    console.log("Exiting...");
    stopSpotBot(sig);
  });
});
