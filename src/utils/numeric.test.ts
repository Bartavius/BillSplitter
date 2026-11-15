import { describe, expect, it } from "vitest";
import { rowPrices } from "./numeric";

describe("rowPrices", () => {
  it("splits a line total to the cent", () => {
    expect(rowPrices(10, 3, "total")).toEqual([3.34, 3.33, 3.33]);
  });

  it("repeats a per-item price for each unit", () => {
    expect(rowPrices(3.5, 2, "each")).toEqual([3.5, 3.5]);
  });

  it("reads both ways the same for a single unit", () => {
    expect(rowPrices(4.25, 1, "total")).toEqual([4.25]);
    expect(rowPrices(4.25, 1, "each")).toEqual([4.25]);
  });

  it("gives no rows for a missing or non-positive price", () => {
    expect(rowPrices(NaN, 2, "each")).toEqual([]);
    expect(rowPrices(0, 2, "total")).toEqual([]);
  });
});
