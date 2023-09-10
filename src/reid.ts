import { randomBytes } from "node:crypto";
import crc16 from "crc/calculators/crc16ccitt";
import { ChecksumError, FormatError } from "./errors";

const CROCKFORD_BASE_32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const LINT_REGEX = new RegExp(`[^${CROCKFORD_BASE_32}]`, "g");
let delimiter = "_";

// TODO: Fix type alias
type ReID = string;

function encodeCrockfordBase32(buf: Buffer, maxLength?: number) {
  const b32 = [];
  const textBuf = BigInt("0x" + buf.toString("hex"))
    .toString(2)
    .padStart(buf.length * 8, "0");
  let i = 0;
  const length = maxLength || buf.length * 8;
  while (i < length) {
    b32.push(CROCKFORD_BASE_32[parseInt(textBuf.slice(i, i + 5), 2)]);
    i += 5;
  }
  return b32.join("");
}

function decodeCrockfordBase32(encoded: string) {
  const chars = encoded.split("");
  const textBuf = chars
    .map((char) => CROCKFORD_BASE_32.indexOf(char))
    .reduce((str, pos) => str + pos.toString(2).padStart(5, "0"), "");
  const length = Math.ceil((chars.length * 5) / 8);
  const buf = Buffer.alloc(length);
  for (let byte = 0; byte < length; byte++) {
    const slice = textBuf.slice(byte * 8, (byte + 1) * 8).padEnd(8, "0");
    buf[byte] = parseInt(slice, 2);
  }

  return buf;
}

export function setDelimiter(newDelimiter: "_" | "-" | "/" | "\\" | ".") {
  delimiter = newDelimiter;
}

export function reid(reidOrPrefix?: string | ReID): ReID {
  if (
    reidOrPrefix &&
    (reidOrPrefix.includes(delimiter) || reidOrPrefix.length > 23)
  ) {
    const tokenParts = reidOrPrefix.split(delimiter);
    const id = tokenParts.slice(-1)[0];
    const linted = id
      .toUpperCase()
      .replaceAll(/[oO]/g, "0")
      .replaceAll(/[iIlL]/g, "1");
    if (linted.match(LINT_REGEX)) {
      throw new FormatError();
    }

    const decodedReid = decodeCrockfordBase32(linted);
    const decodedChecksum = decodedReid.readUInt16BE(13);
    const calculatedChecksum = crc16(decodedReid.subarray(0, 13));

    if (decodedChecksum !== calculatedChecksum) {
      throw new ChecksumError();
    }

    const r = tokenParts.length === 2 ? tokenParts[0] + delimiter + linted : linted;

    return r;
  } else {
    const time = BigInt(
      Math.floor((performance.timeOrigin + performance.now()) * 1000),
    );
    const timeBuf = Buffer.alloc(8);
    timeBuf.writeBigInt64BE(time);

    const finalBuf = Buffer.alloc(15);
    timeBuf.copy(finalBuf, 0, 1);
    randomBytes(6).copy(finalBuf, 7);

    const crc = crc16(finalBuf.subarray(0, 13));
    finalBuf.writeUInt16BE(crc, 13);

    const b32 = encodeCrockfordBase32(finalBuf);

    return reidOrPrefix ? reidOrPrefix + delimiter + b32 : b32;
  }
}

export default reid;
