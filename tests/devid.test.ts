import { DevIDError } from "../src/errors";
import devid, { DevID, setDelimiter } from "../src/devid";

describe("devid creation", () => {
  it("should create a devid, with no prefixes", () => {
    const id = devid();
    expect(id).toBeInstanceOf(DevID);
    expect(id.toString()).toHaveLength(24);
  });

  it("should create a devid, with a prefix", () => {
    const id = devid("prefix");
    expect(id).toBeInstanceOf(DevID);
    expect(id.toString()).toHaveLength(31);
    expect(id.toString()).toMatch(/^prefix_[A-Z0-9]+$/);
  });

  it("should create a devid, with a prefix and a different delimiter", () => {
    setDelimiter("-");
    const id = devid("prefix");
    expect(id).toBeInstanceOf(DevID);
    expect(id.toString()).toHaveLength(31);
    expect(id.toString()).toMatch(/^prefix-[A-Z0-9]+$/);
    setDelimiter("_");
  });

  it("should fail to create a devid if the prefix is too long", () => {
    expect(() => {
      devid("1234567890123456789012345");
    }).toThrow(DevIDError);
  });
});

describe("devid parsing", () => {
  it("should initialize a devid, with no prefix", () => {
    const id = devid().toString();
    const initId = devid(id);
    expect(initId).toBeInstanceOf(DevID);
    expect(initId.toString()).toHaveLength(24);
  });

  it("should initialize a devid, with a prefix", () => {
    const id = devid("prefix").toString();
    const initId = devid(id);
    expect(initId).toBeInstanceOf(DevID);
    expect(initId.toString()).toHaveLength(31);
    expect(initId.toString()).toMatch(/^prefix_[A-Z0-9]+$/);
  });

  it("should initialize a devid, with a prefix and a different delimiter", () => {
    setDelimiter("-");
    const id = devid("prefix").toString();
    const initId = devid(id);
    expect(initId).toBeInstanceOf(DevID);
    expect(initId.toString()).toHaveLength(31);
    expect(initId.toString()).toMatch(/^prefix-[A-Z0-9]+$/);
    setDelimiter("_");
  });

  it("should fail to initialize a devid if there are invalid characters", () => {
    expect(() => {
      devid("12345678901234567890123.");
    }).toThrow(DevIDError);
  });

  it("should fail to initialize a devid if it was tampered with", () => {
    let id = devid().toString().split("");
    id[0] = id[0] === "1" ? "2" : "1";
    expect(() => {
      devid(id.join(""));
    }).toThrow(DevIDError);
  });
});