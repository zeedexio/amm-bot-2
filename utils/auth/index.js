const {
  hashPersonalMessage,
  ecsign,
  toRpcSig,
  toBuffer,
  privateToAddress,
} = require("ethereumjs-util");

async function getAuthToken(_privKey) {
  let message = "ZEEDEX-AUTHENTICATION" + Date.now();

  if (message.slice(0, 2) !== "0x") {
    message = "0x" + Buffer.from(message).toString("hex");
  }

  const address = "0x" + privateToAddress(_privKey).toString("hex");

  const sha = hashPersonalMessage(toBuffer(message));
  const ecdsaSignature = ecsign(sha, toBuffer(_privKey));
  const signature = toRpcSig(
    ecdsaSignature.v,
    ecdsaSignature.r,
    ecdsaSignature.s
  );
  const final = address + "#" + message + "#" + signature;
  // console.log(final);
  return final;
}

module.exports = getAuthToken;
