// Generate an ID that can be used both as a secure token and a random ID
// Compact
// Readable / Writable
// Verifiable offline
// Secure
// Clear intent

const crypto = require("crypto");
const CRC32 = require("crc-32");
const process = require("process");

const CROCKFORD_BASE_32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeCrockfordBase32(buf, maxLength = null) {
  const b32 = [];
  const textBuf = BigInt("0x" + buf.toString("hex")).toString(2).padStart(buf.length * 8, "0");
  let i = 0;
  const length = maxLength || buf.length * 8;
  while (i < length) {
    b32.push(CROCKFORD_BASE_32[parseInt(textBuf.slice(i, i+5), 2)]);
    i += 5;
  }
  return b32.join("");
}

function decodeCrockfordBase32(encoded) {
  const chars = encoded.split("");
  const textBuf = chars.map((char) => CROCKFORD_BASE_32.indexOf(char)).reduce((str, pos) => str + pos.toString(2).padStart(5, "0"), "");
  const length = Math.ceil(chars.length * 5 / 8);
  const buf = Buffer.alloc(length);
  for (let byte = 0; byte < length; byte++) {
    const slice = textBuf.slice(byte*8, (byte+1)*8).padEnd(8, "0");
    buf[byte] = parseInt(slice, 2);
  }
  
  return buf;
}

function reid(prefix = null) {
  // 40 bits for timestamp
  // 58 bits randomness
  // 32 bits CRC32
  // output: 26 characters + prefix

  const time = Date.now();
  const timeBuf = Buffer.alloc(8);
  timeBuf.writeBigInt64BE(BigInt(time));

  const finalBuf = Buffer.alloc(17);
  timeBuf.copy(finalBuf, 0, 3);
  crypto.randomBytes(8).copy(finalBuf, 5);
  
  finalBuf[12] = (finalBuf[12] >>> 6) << 6;
  const checksum = CRC32.buf(finalBuf.subarray(0, 13), 0);

  finalBuf.writeInt32BE(checksum, 13);
  
  finalBuf[12] += (finalBuf[13] >>> 2);
  finalBuf[13] = (finalBuf[13] << 6) + (finalBuf[14] >>> 2);
  finalBuf[14] = (finalBuf[14] << 6) + (finalBuf[15] >>> 2);
  finalBuf[15] = (finalBuf[15] << 6) + (finalBuf[16] >>> 2);
  finalBuf[16] = finalBuf[16] << 6;

  const b32 = encodeCrockfordBase32(finalBuf, 130);

  return prefix ? `${prefix}_${b32}` : b32;
}

function validateReid(reid) {
  const cleanReid = lintReid(reid).split("_").slice(-1)[0];
  const decodedReid = decodeCrockfordBase32(cleanReid);
  decodedReid[16] = (decodedReid[15] << 2) + (decodedReid[16] >>> 6);
  decodedReid[15] = (decodedReid[14] << 2) + (decodedReid[15] >>> 6);
  decodedReid[14] = (decodedReid[13] << 2) + (decodedReid[14] >>> 6);
  decodedReid[13] = (decodedReid[12] << 2) + (decodedReid[13] >>> 6);
  decodedReid[12] = (decodedReid[12] >>> 6) << 6;
  const decodedChecksum = decodedReid.readInt32BE(13);
  const calculatedChecksum = CRC32.buf(decodedReid.subarray(0, 13), 0);

  if (decodedChecksum !== calculatedChecksum) {
    throw new Error("Invalid ID");
  }

  return true;
}

function lintReid(token) {
  const regex = /[^0123456789ABCDEFGHJKMNPQRSTVWXYZ]/g;
  const tokenParts = token.split("_");
  const reid = tokenParts.slice(-1)[0];
  const linted = reid.toUpperCase().replaceAll(/[oO]/g, "0").replaceAll(/[iIlL]/g, "1");
  if (linted.match(regex)) {
    throw new Error("Invalid format");
  }
  if (tokenParts.length === 2) {
    return `${tokenParts[0]}_${linted}`;
  }
  return linted;
}

// const token = reid("pk");
// console.log(token);
// validateReid(token);
console.log((performance.timeOrigin + performance.now())*1000);