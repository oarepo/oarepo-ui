import {
  findSectionIndexForFieldPath,
  isErrorObject,
  flattenToPathValueArray,
} from "./util";

describe("findSectionIndexForFieldPath", () => {
  const sections = [
    { key: "basic", includesPaths: ["metadata.title", "metadata.description"] },
    { key: "creators", includesPaths: ["metadata.creators", "metadata.contributors"] },
    { key: "files", includesPaths: ["files"] },
  ];

  it("returns -1 for null/undefined sections", () => {
    expect(findSectionIndexForFieldPath(null, "metadata.title")).toBe(-1);
    expect(findSectionIndexForFieldPath(undefined, "metadata.title")).toBe(-1);
  });

  it("returns -1 for null/undefined fieldPath", () => {
    expect(findSectionIndexForFieldPath(sections, null)).toBe(-1);
    expect(findSectionIndexForFieldPath(sections, undefined)).toBe(-1);
  });

  it("returns correct index for exact path match", () => {
    expect(findSectionIndexForFieldPath(sections, "metadata.title")).toBe(0);
    expect(findSectionIndexForFieldPath(sections, "metadata.creators")).toBe(1);
    expect(findSectionIndexForFieldPath(sections, "files")).toBe(2);
  });

  it("returns correct index for nested path (prefix match)", () => {
    expect(findSectionIndexForFieldPath(sections, "metadata.title.value")).toBe(0);
    expect(findSectionIndexForFieldPath(sections, "metadata.creators.0.name")).toBe(1);
    expect(findSectionIndexForFieldPath(sections, "files.enabled")).toBe(2);
  });

  it("returns -1 for non-matching path", () => {
    expect(findSectionIndexForFieldPath(sections, "metadata.unknown")).toBe(-1);
    expect(findSectionIndexForFieldPath(sections, "other.field")).toBe(-1);
  });

  it("handles sections without includesPaths", () => {
    const sectionsWithoutPaths = [{ key: "empty" }];
    expect(findSectionIndexForFieldPath(sectionsWithoutPaths, "metadata.title")).toBe(-1);
  });
});

describe("isErrorObject", () => {
  it("returns true for new error format object", () => {
    const errorObj = {
      message: "This field is required",
      severity: "error",
      description: "Field must not be empty",
    };
    expect(isErrorObject(errorObj)).toBe(true);
  });

  it("returns true for warning severity", () => {
    const warningObj = {
      message: "Consider adding more detail",
      severity: "warning",
      description: "Optional but recommended",
    };
    expect(isErrorObject(warningObj)).toBe(true);
  });

  it("returns false for plain string", () => {
    expect(isErrorObject("This field is required")).toBe(false);
  });

  it("returns false for object missing message", () => {
    expect(isErrorObject({ severity: "error", description: "desc" })).toBe(false);
  });

  it("returns false for object missing severity", () => {
    expect(isErrorObject({ message: "msg", description: "desc" })).toBe(false);
  });

  it("returns false for object missing description", () => {
    expect(isErrorObject({ message: "msg", severity: "error" })).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isErrorObject(null)).toBe(false);
    expect(isErrorObject(undefined)).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isErrorObject(["message", "severity", "description"])).toBe(false);
  });

  it("returns false for numbers", () => {
    expect(isErrorObject(42)).toBe(false);
  });
});

describe("flattenToPathValueArray", () => {
  describe("with old error format (strings)", () => {
    it("flattens simple nested object with string values", () => {
      const errors = {
        metadata: {
          title: "Title is required",
        },
      };
      const result = flattenToPathValueArray(errors);
      expect(result).toEqual([
        { fieldPath: "metadata.title", value: "Title is required" },
      ]);
    });

    it("flattens deeply nested object with string values", () => {
      const errors = {
        metadata: {
          creators: {
            0: {
              name: "Name is required",
            },
          },
        },
      };
      const result = flattenToPathValueArray(errors);
      expect(result).toEqual([
        { fieldPath: "metadata.creators.0.name", value: "Name is required" },
      ]);
    });

    it("flattens multiple errors with string values", () => {
      const errors = {
        metadata: {
          title: "Title is required",
          description: "Description is too short",
        },
        files: {
          enabled: "At least one file is required",
        },
      };
      const result = flattenToPathValueArray(errors);
      expect(result).toEqual([
        { fieldPath: "metadata.title", value: "Title is required" },
        { fieldPath: "metadata.description", value: "Description is too short" },
        { fieldPath: "files.enabled", value: "At least one file is required" },
      ]);
    });
  });

  describe("with new error format (objects with message/severity/description)", () => {
    it("stops at error object and returns it as value", () => {
      const errors = {
        metadata: {
          title: {
            message: "Title is required",
            severity: "error",
            description: "This field cannot be empty",
          },
        },
      };
      const result = flattenToPathValueArray(errors);
      expect(result).toEqual([
        {
          fieldPath: "metadata.title",
          value: {
            message: "Title is required",
            severity: "error",
            description: "This field cannot be empty",
          },
        },
      ]);
    });

    it("handles multiple new format errors", () => {
      const errors = {
        metadata: {
          title: {
            message: "Title is required",
            severity: "error",
            description: "Must provide title",
          },
          description: {
            message: "Description too short",
            severity: "warning",
            description: "Consider adding more detail",
          },
        },
      };
      const result = flattenToPathValueArray(errors);
      expect(result).toEqual([
        {
          fieldPath: "metadata.title",
          value: {
            message: "Title is required",
            severity: "error",
            description: "Must provide title",
          },
        },
        {
          fieldPath: "metadata.description",
          value: {
            message: "Description too short",
            severity: "warning",
            description: "Consider adding more detail",
          },
        },
      ]);
    });

    it("handles deeply nested new format errors", () => {
      const errors = {
        metadata: {
          creators: {
            0: {
              name: {
                message: "Creator name required",
                severity: "error",
                description: "Each creator must have a name",
              },
            },
          },
        },
      };
      const result = flattenToPathValueArray(errors);
      expect(result).toEqual([
        {
          fieldPath: "metadata.creators.0.name",
          value: {
            message: "Creator name required",
            severity: "error",
            description: "Each creator must have a name",
          },
        },
      ]);
    });
  });

  describe("with mixed error formats", () => {
    it("handles both old and new format errors together", () => {
      const errors = {
        metadata: {
          title: "Title is required",
          description: {
            message: "Description too short",
            severity: "warning",
            description: "Consider adding more detail",
          },
        },
      };
      const result = flattenToPathValueArray(errors);
      expect(result).toEqual([
        { fieldPath: "metadata.title", value: "Title is required" },
        {
          fieldPath: "metadata.description",
          value: {
            message: "Description too short",
            severity: "warning",
            description: "Consider adding more detail",
          },
        },
      ]);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for empty object", () => {
      expect(flattenToPathValueArray({})).toEqual([]);
    });

    it("handles null values", () => {
      const errors = { metadata: { title: null } };
      const result = flattenToPathValueArray(errors);
      expect(result).toEqual([{ fieldPath: "metadata.title", value: null }]);
    });

    it("handles Date objects as leaf values", () => {
      const date = new Date("2024-01-01");
      const errors = { metadata: { date } };
      const result = flattenToPathValueArray(errors);
      expect(result).toEqual([{ fieldPath: "metadata.date", value: date }]);
    });

    it("handles RegExp objects as leaf values", () => {
      const regex = /test/;
      const errors = { metadata: { pattern: regex } };
      const result = flattenToPathValueArray(errors);
      expect(result).toEqual([{ fieldPath: "metadata.pattern", value: regex }]);
    });

    it("handles number values", () => {
      const errors = { metadata: { count: 42 } };
      const result = flattenToPathValueArray(errors);
      expect(result).toEqual([{ fieldPath: "metadata.count", value: 42 }]);
    });

    it("handles boolean values", () => {
      const errors = { files: { enabled: false } };
      const result = flattenToPathValueArray(errors);
      expect(result).toEqual([{ fieldPath: "files.enabled", value: false }]);
    });
  });
});
