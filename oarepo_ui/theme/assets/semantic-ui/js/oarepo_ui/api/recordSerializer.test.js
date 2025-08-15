import { OARepoDepositSerializer } from "./recordSerializer";
import * as iar from "@js/invenio_app_rdm/search"

console.log("Hello from tests")

console.log(iar)

describe("OARepoDepositSerializer", () => {
  let serializer;

  beforeEach(() => {
    serializer = new OARepoDepositSerializer(["internalField"], ["__key"]);
  });

  describe("removeEmptyValues", () => {
    it("removes empty objects and arrays from arrays", () => {
      const input = [{}, { a: 1 }, [], null];
      const result = serializer.removeEmptyValues(input);
      // {} removed, [] removed, null removed
      expect(result).toEqual([{ a: 1 }]);
    });

    it("keeps numbers and booleans even if falsy", () => {
      expect(serializer.removeEmptyValues(0)).toBe(0);
      expect(serializer.removeEmptyValues(false)).toBe(false);
    });

    it("returns null if value is falsy non-number/non-boolean", () => {
      expect(serializer.removeEmptyValues("")).toBeNull();
      expect(serializer.removeEmptyValues(undefined)).toBeNull();
    });

    it('keeps "metadata" key even if empty, removes other empty object keys', () => {
      const input = {
        metadata: {},
        emptyObj: {},
        nestedEmptyArr: [],
        keep: "ok",
      };
      const result = serializer.removeEmptyValues(input);
      // metadata is kept, emptyObj & nestedEmptyArr removed
      expect(result).toEqual({ metadata: {}, keep: "ok" });
    });

    it("recurses into nested structures", () => {
      const input = {
        arr: [{}, { x: null }, { x: "value", y: {} }, 0, true],
      };
      const result = serializer.removeEmptyValues(input);
      expect(result).toEqual({
        arr: [{ x: "value" }, true],
      });
    });
  });

  describe("removeKeysFromNestedObjects", () => {
    it("removes specified keys from objects deeply", () => {
      const input = {
        a: 1,
        __key: "remove",
        nested: { __key: "remove", keep: "yes" },
      };
      const result = serializer.removeKeysFromNestedObjects(input, ["__key"]);
      expect(result).toEqual({ a: 1, nested: { keep: "yes" } });
    });

    it("removes keys from arrays deeply", () => {
      const input = [{ __key: "remove", b: 2 }, [{ __key: "remove", c: 3 }]];
      const result = serializer.removeKeysFromNestedObjects(input, ["__key"]);
      expect(result).toEqual([{ b: 2 }, [{ c: 3 }]]);
    });

    it("handles case where keysToRemove is empty", () => {
      const input = { a: { b: 1 } };
      const result = serializer.removeKeysFromNestedObjects(input, []);
      expect(result).toEqual(input);
    });
  });

  describe("removeNullAndInternalFields", () => {
    it("removes nulls, arrays of nulls, _ keys, and internal fields", () => {
      const input = {
        a: null,
        b: [null, null],
        _private: "secret",
        internalField: "remove me",
        keep: "ok",
      };
      const result = serializer.removeNullAndInternalFields(input, [
        "internalField",
      ]);
      expect(result).toEqual({ keep: "ok" });
    });

    it("keeps non-null arrays even if some elements are null", () => {
      const input = { arr: [null, 1] };
      const result = serializer.removeNullAndInternalFields(input, []);
      expect(result).toEqual({ arr: [null, 1] });
    });
  });

  describe("serialize", () => {
    it("applies all three cleaning methods in order", () => {
      const input = {
        a: null,
        _private: "secret",
        internalField: "remove me",
        keep: "ok",
        nested: { __key: "remove", value: null },
      };

      const spyNullAndInternal = jest.spyOn(
        serializer,
        "removeNullAndInternalFields"
      );
      const spyRemoveKeys = jest.spyOn(
        serializer,
        "removeKeysFromNestedObjects"
      );
      const spyRemoveEmpty = jest.spyOn(serializer, "removeEmptyValues");

      const result = serializer.serialize(input);

      expect(result).toEqual({ keep: "ok" });
      expect(spyNullAndInternal).toHaveBeenCalledTimes(1);
      expect(spyRemoveKeys).toHaveBeenCalledTimes(1);
      expect(spyRemoveEmpty).toHaveBeenCalledTimes(1);
    });
  });

  // ---- deserializeErrors ----
  describe("deserializeErrors", () => {
    it("handles new error format with severity and description", () => {
      const errors = [
        {
          field: "field1",
          messages: ["error message"],
          severity: "high",
          description: "more info",
        },
      ];
      const result = serializer.deserializeErrors(errors);
      expect(result).toEqual({
        field1: {
          message: "error message",
          severity: "high",
          description: "more info",
        },
      });
    });

    it("handles old error format", () => {
      const errors = [{ field: "field2", messages: ["old error"] }];
      const result = serializer.deserializeErrors(errors);
      expect(result).toEqual({
        field2: "old error",
      });
    });

    it("combines multiple errors of both types", () => {
      const errors = [
        { field: "a", messages: ["msg1"] },
        {
          field: "b",
          messages: ["msg2"],
          severity: "low",
          description: "desc",
        },
      ];
      const result = serializer.deserializeErrors(errors);
      expect(result).toEqual({
        a: "msg1",
        b: { message: "msg2", severity: "low", description: "desc" },
      });
    });

    it("joins multiple messages into one string", () => {
      const errors = [{ field: "x", messages: ["m1", "m2"] }];
      const result = serializer.deserializeErrors(errors);
      expect(result).toEqual({ x: "m1 m2" });
    });
  });
});
