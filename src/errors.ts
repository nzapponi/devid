export class DevIDError extends Error {
  constructor(readonly type: "FormatError" | "ChecksumError") {
    super();
  }
}
