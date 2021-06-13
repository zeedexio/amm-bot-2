require("dotenv").config();
const { sleep } = require("../misc/sleep");

exports.getEnvErrors = () => {
  if (!process.env.PRIVATE_KEY) {
    return { error: "PRIVATE_KEY Required" };
  }
  if (!process.env.BASE_SYMBOL) {
    return { error: "BASE_SYMBOL Required" };
  }
  if (!process.env.BASE_NAME) {
    return { error: "BASE_NAME Required" };
  }
  if (!process.env.QUOTE_SYMBOL) {
    return { error: "QUOTE_SYMBOL Required" };
  }
  if (!process.env.QUOTE_NAME) {
    return { error: "QUOTE_NAME Required" };
  }
  if (!process.env.DEX_API_URL) {
    return { error: "DEX_API_URL Required" };
  }
  //  if(!process.env.MIN_PRICE) {
  //     return {error:"MIN_PRICE Required"}
  //  }
  //  if(!process.env.MAX_PRICE) {
  //     return {error:"MAX_PRICE Required"}
  //  }
  if (!process.env.ORDER_STEP) {
    return { error: "ORDER_STEP Required" };
  }
  if (
    Number(process.env.ORDER_STEP) > 1 ||
    Number(process.env.ORDER_STEP) < 0.01
  ) {
    return { error: "ORDER_STEP Invalid, must be between 1 and 0.01" };
  }

  if (!process.env.EXPAND_INVENTORY) {
    return { error: "EXPAND_INVENTORY Required" };
  }
  if (
    Number(process.env.EXPAND_INVENTORY) > 1 ||
    Number(process.env.EXPAND_INVENTORY) < 0.01
  ) {
    return { error: "EXPAND_INVENTORY Invalid, must be between 1 and 0.01" };
  }

  if (!process.env.MAX_ORDERBOOK_LENGTH) {
    return { error: "MAX_ORDERBOOK_LENGTH Required" };
  }
  if (
    Number(process.env.MAX_ORDERBOOK_LENGTH) > 50 ||
    Number(process.env.MAX_ORDERBOOK_LENGTH) < 1
  ) {
    return { error: "MAX_ORDERBOOK_LENGTH Invalid, must be between 50 and 1" };
  }

  if (!process.env.RPC_URL) {
    return { error: "RPC_URL Required" };
  }
  if (!process.env.PRICE_PROVIDER) {
    return { error: "PRICE_PROVIDER Required" };
  }
  if (!process.env.SPEED) {
    return { error: "SPEED Required" };
  }
  if (Number(process.env.SPEED) < 10000) {
    return { error: "SPEED Invalid, must be above 10000 ms" };
  }
};
