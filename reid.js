// Generate an ID that can be used both as a secure token and a random ID
// Compact (24 characters + prefix)
// Readable / Writable
// Verifiable offline
// Secure (2.8e+14 randomness per microsecond)
// Clear intent

const crypto = require("node:crypto");
const crc16 = require("crc/calculators/crc16ccitt");

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
  // 56 bits for timestamp (microseconds)
  // 48 bits randomness
  // 16 bits CRC-16
  // output: 24 characters + prefix

  const time = BigInt(Math.floor((performance.timeOrigin + performance.now()) * 1000));
  const timeBuf = Buffer.alloc(8);
  timeBuf.writeBigInt64BE(time);

  const finalBuf = Buffer.alloc(15);
  timeBuf.copy(finalBuf, 0, 1);
  crypto.randomBytes(6).copy(finalBuf, 7);

  const crc = crc16(finalBuf.subarray(0, 13));
  finalBuf.writeUInt16BE(crc, 13);

  const b32 = encodeCrockfordBase32(finalBuf);
  return prefix ? `${prefix}_${b32}` : b32;
}

function validateReid(reid) {
  const cleanReid = lintReid(reid).split("_").slice(-1)[0];
  const decodedReid = decodeCrockfordBase32(cleanReid);
  const decodedChecksum = decodedReid.readUInt16BE(13);
  const calculatedChecksum = crc16(decodedReid.subarray(0, 13));

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

const token = reid("pk");
console.log(token);
validateReid(token);