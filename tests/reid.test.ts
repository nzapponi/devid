import { ChecksumError, FormatError } from "../src/errors";
import reid, { ReID, setDelimiter } from "../src/reid";

describe("reid creation", () => {
  it("should create a reid, with no prefixes", () => {
    const id = reid();
    expect(id).toBeInstanceOf(ReID);
    expect(id.toString()).toHaveLength(24);
  });

  it("should create a reid, with a prefix", () => {
    const id = reid("prefix");
    expect(id).toBeInstanceOf(ReID);
    expect(id.toString()).toHaveLength(31);
    expect(id.toString()).toMatch(/^prefix_[A-Z0-9]+$/);
  });

  it("should create a reid, with a prefix and a different delimiter", () => {
    setDelimiter("-");
    const id = reid("prefix");
    expect(id).toBeInstanceOf(ReID);
    expect(id.toString()).toHaveLength(31);
    expect(id.toString()).toMatch(/^prefix-[A-Z0-9]+$/);
    setDelimiter("_");
  });

  it("should fail to create a reid if the prefix is too long", () => {
    expect(() => {
      reid("1234567890123456789012345");
    }).toThrow(FormatError);
  });
});

describe("reid parsing", () => {
  it("should initialize a reid, with no prefix", () => {
    const id = reid().toString();
    const initId = reid(id);
    expect(initId).toBeInstanceOf(ReID);
    expect(initId.toString()).toHaveLength(24);
  });

  it("should initialize a reid, with a prefix", () => {
    const id = reid("prefix").toString();
    const initId = reid(id);
    expect(initId).toBeInstanceOf(ReID);
    expect(initId.toString()).toHaveLength(31);
    expect(initId.toString()).toMatch(/^prefix_[A-Z0-9]+$/);
  });

  it("should initialize a reid, with a prefix and a different delimiter", () => {
    setDelimiter("-");
    const id = reid("prefix").toString();
    const initId = reid(id);
    expect(initId).toBeInstanceOf(ReID);
    expect(initId.toString()).toHaveLength(31);
    expect(initId.toString()).toMatch(/^prefix-[A-Z0-9]+$/);
    setDelimiter("_");
  });

  it("should fail to initialize a reid if there are invalid characters", () => {
    expect(() => {
      reid("12345678901234567890123.");
    }).toThrow(FormatError);
  });

  it("should fail to initialize a reid if it was tampered with", () => {
    let id = reid().toString().split("");
    id[0] = id[0] === "1" ? "2" : "1";
    expect(() => {
      reid(id.join(""));
    }).toThrow(ChecksumError);
  });
});