require("dotenv").config();
const { sleep } = require("../misc/sleep");

exports.getEnvErrors = () => {
  if (!process.env.PRIVATE_KEY) {
    return { error: "PRIVATE_KEY Required" };
  }
  if (!process.env.BASE_SYMBOL) {
    return { error: "BASE_SYMBOL Required" };
  }
  if (!process.env.QUOTE_SYMBOL) {
    return { error: "QUOTE_SYMBOL Required" };
  }
  if (!process.env.DEX_API_URL) {
    return { error: "DEX_API_URL Required" };
  }

  if (!process.env.PRICE_GAP) {
    return { error: "PRICE_GAP Required" };
  }
  if (
    Number(process.env.PRICE_GAP) > 1 ||
    Number(process.env.PRICE_GAP) < 0.01
  ) {
    return { error: "PRICE_GAP Invalid, must be between 1 and 0.01" };
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

  if (
    process.env.MANUAL_INIT_PRICE &&
    Number(process.env.MANUAL_INIT_PRICE) <= 0
  ) {
    return { error: "MANUAL_INIT_PRICE Invalid, must be more than 0" };
  }

  if (!process.env.RPC_URL) {
    return { error: "RPC_URL Required" };
  }

  if (!process.env.SPEED) {
    return { error: "SPEED Required" };
  }
  if (Number(process.env.SPEED) < 10000) {
    return { error: "SPEED Invalid, must be above 10000 ms" };
  }
};
