require("dotenv").config();

exports.logPrint = async (text) => {
  const debugEnabled = process.env.DEBUG == "true" ? true : false;

  if (debugEnabled == true) {
    console.log("\x1b[2m%s\x1b[0m", text); //dim
  }
};
