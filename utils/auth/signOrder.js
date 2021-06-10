const {
  hashPersonalMessage,
  ecsign,
  toRpcSig,
  toBuffer,
} = require("ethereumjs-util");

function signOrder(_privKey, _orderId) {
  let message = _orderId;
  if (message.slice(0, 2) !== "0x") {
    message = "0x" + Buffer.from(message).toString("hex");
  }

  const sha = hashPersonalMessage(toBuffer(message));
  const ecdsaSignature = ecsign(sha, toBuffer(_privKey));
  const signature = toRpcSig(
    ecdsaSignature.v,
    ecdsaSignature.r,
    ecdsaSignature.s
  );

  let sign =
    "0x" + signature.slice(130) + "0".repeat(62) + signature.slice(2, 130);

  return sign;
}

module.exports = signOrder;
