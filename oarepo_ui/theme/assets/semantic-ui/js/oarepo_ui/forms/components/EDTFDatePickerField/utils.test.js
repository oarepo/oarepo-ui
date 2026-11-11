// SPDX-FileCopyrightText: 2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import {
  deserializeDate,
  getEdtfDateError,
  getInitialEdtfDateFormat,
  maskEdtfInput,
} from "./utils";

const type = (raw, allowRange = true) =>
  maskEdtfInput(raw, raw.length, allowRange).value;

describe("maskEdtfInput", () => {
  it("adds dashes to digits", () => {
    expect(type("20240305")).toBe("2024-03-05");
    expect(type("202403")).toBe("2024-03");
    expect(type("2024")).toBe("2024");
    expect(type("2024-")).toBe("2024-");
  });

  it("pads a month or day digit that can't start a two-digit one", () => {
    expect(type("20244")).toBe("2024-04");
    expect(type("2024035")).toBe("2024-03-05");
    expect(type("20241")).toBe("2024-1");
  });

  it("drops anything else and caps a date at 8 digits", () => {
    expect(type("2024.03 x05")).toBe("2024-03-05");
    expect(type("202403051")).toBe("2024-03-05");
  });

  it("splits a range at the first slash, only when allowed", () => {
    expect(type("2024/202506")).toBe("2024/2025-06");
    expect(type("2024/2025/06")).toBe("2024/2025-06");
    expect(type("2024/", false)).toBe("2024");
  });

  it("keeps the caret after the same digit when the mask reflows", () => {
    // backspace over the dash of 2024-|03
    expect(maskEdtfInput("202403", 4, true)).toEqual({
      value: "2024-03",
      caret: 4,
    });
    // a slash the single picker drops doesn't count
    expect(maskEdtfInput("20/24", 3, false)).toEqual({
      value: "2024",
      caret: 2,
    });
  });

  it("overwrites the next digit when typing inside a complete date", () => {
    // typed 4 at 2024-0|3-05
    expect(maskEdtfInput("2024-043-05", 7, true, true)).toEqual({
      value: "2024-04-05",
      caret: 7,
    });
  });
});

describe("deserializeDate", () => {
  it("parses EDTF dates strictly", () => {
    expect(deserializeDate("2024-03-05")).toEqual(new Date(2024, 2, 5));
    expect(deserializeDate("2024-03")).toEqual(new Date(2024, 2, 1));
    expect(deserializeDate("0099").getFullYear()).toBe(99);
    expect(deserializeDate("2024-0")).toBeNull();
    expect(deserializeDate("202")).toBeNull();
    expect(deserializeDate("2023-02-29")).toBeNull();
    expect(deserializeDate("2024-13")).toBeNull();
    expect(deserializeDate("")).toBeNull();
  });
});

describe("getInitialEdtfDateFormat", () => {
  it("takes the precision of the first date", () => {
    expect(getInitialEdtfDateFormat("2024")).toBe("yyyy");
    expect(getInitialEdtfDateFormat("2024-03/2025")).toBe("yyyy-mm");
    expect(getInitialEdtfDateFormat("/2025-03-01")).toBe("yyyy-mm-dd");
  });

  it("falls back while the value isn't a date", () => {
    expect(getInitialEdtfDateFormat("")).toBe("yyyy-mm-dd");
    expect(getInitialEdtfDateFormat("2024-0", "yyyy")).toBe("yyyy");
  });
});

describe("getEdtfDateError", () => {
  it("accepts dates, ranges and empty values", () => {
    expect(getEdtfDateError("", true)).toBeNull();
    expect(getEdtfDateError("2024-03-05", false)).toBeNull();
    expect(getEdtfDateError("2024/2025-06", true)).toBeNull();
    // a start inside the end's year is fine
    expect(getEdtfDateError("2024-03/2024", true)).toBeNull();
  });

  it("rejects incomplete, malformed, impossible and reversed values", () => {
    expect(getEdtfDateError("2024", true)).not.toBeNull();
    expect(getEdtfDateError("2024/", true)).not.toBeNull();
    expect(getEdtfDateError("2024-0", false)).not.toBeNull();
    expect(getEdtfDateError("2023-02-29", false)).not.toBeNull();
    expect(getEdtfDateError("2025/2024-06", true)).not.toBeNull();
    expect(getEdtfDateError("2024-06/2024-03-15", true)).not.toBeNull();
  });
});
