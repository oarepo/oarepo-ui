import {
  findSectionIndexForFieldPath,
  isErrorObject,
  flattenToPathValueArray,
  findErrorObjects,
  getSubfieldErrors,
  categorizeErrors,
  mergeFieldData,
} from "./util";

describe("findSectionIndexForFieldPath", () => {
  const sections = [
    { key: "basic", includesPaths: ["metadata.title", "metadata.description"] },
    {
      key: "creators",
      includesPaths: ["metadata.creators", "metadata.contributors"],
    },
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
    expect(findSectionIndexForFieldPath(sections, "metadata.title.value")).toBe(
      0
    );
    expect(
      findSectionIndexForFieldPath(sections, "metadata.creators.0.name")
    ).toBe(1);
    expect(findSectionIndexForFieldPath(sections, "files.enabled")).toBe(2);
  });

  it("returns -1 for non-matching path", () => {
    expect(findSectionIndexForFieldPath(sections, "metadata.unknown")).toBe(-1);
    expect(findSectionIndexForFieldPath(sections, "other.field")).toBe(-1);
  });

  it("handles sections without includesPaths", () => {
    const sectionsWithoutPaths = [{ key: "empty" }];
    expect(
      findSectionIndexForFieldPath(sectionsWithoutPaths, "metadata.title")
    ).toBe(-1);
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
    expect(isErrorObject({ severity: "error", description: "desc" })).toBe(
      false
    );
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
        {
          fieldPath: "metadata.description",
          value: "Description is too short",
        },
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

describe("findErrorObjects", () => {
  it("finds error objects in nested structure", () => {
    const obj = {
      metadata: {
        title: {
          message: "Required",
          severity: "error",
          description: "Field must not be empty",
        },
      },
    };
    const result = findErrorObjects(obj);
    expect(result).toEqual([
      {
        message: "Required",
        severity: "error",
        description: "Field must not be empty",
      },
    ]);
  });

  it("finds multiple error objects at different levels", () => {
    const obj = {
      metadata: {
        title: {
          message: "Title required",
          severity: "error",
          description: "Must provide title",
        },
        creators: {
          0: {
            name: {
              message: "Name required",
              severity: "warning",
              description: "Creator name is recommended",
            },
          },
        },
      },
    };
    const result = findErrorObjects(obj);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      message: "Title required",
      severity: "error",
      description: "Must provide title",
    });
    expect(result).toContainEqual({
      message: "Name required",
      severity: "warning",
      description: "Creator name is recommended",
    });
  });

  it("finds old format string errors", () => {
    const obj = { metadata: { title: "Title is required" } };
    const result = findErrorObjects(obj);
    expect(result).toEqual(["Title is required"]);
  });

  it("finds string errors in arrays", () => {
    const obj = {
      metadata: {
        additional_descriptions: [{ type: "Missing data for required field." }],
      },
    };
    const result = findErrorObjects(obj);
    expect(result).toEqual(["Missing data for required field."]);
  });

  it("finds mixed old and new format errors", () => {
    const obj = {
      metadata: {
        title: "Old format error",
        description: {
          message: "New format",
          severity: "error",
          description: "Desc",
        },
      },
    };
    const result = findErrorObjects(obj);
    expect(result).toHaveLength(2);
    expect(result).toContain("Old format error");
    expect(result).toContainEqual({
      message: "New format",
      severity: "error",
      description: "Desc",
    });
  });

  it("returns empty array for null", () => {
    const result = findErrorObjects(null);
    expect(result).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    const result = findErrorObjects(undefined);
    expect(result).toEqual([]);
  });

  it("returns empty array for numbers", () => {
    expect(findErrorObjects(42)).toEqual([]);
  });

  it("returns string when given a string directly", () => {
    expect(findErrorObjects("error message")).toEqual(["error message"]);
  });

  it("does not traverse into error objects", () => {
    const errorObj = {
      message: "Error",
      severity: "error",
      description: "Desc",
      nested: {
        message: "Nested error",
        severity: "warning",
        description: "Should not be found",
      },
    };
    const result = findErrorObjects({ field: errorObj });
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe("Error");
  });
});

describe("getSubfieldErrors", () => {
  const createErrorObj = (message, severity = "error") => ({
    message,
    severity,
    description: `Description for ${message}`,
  });

  it("returns error object directly when path points to error object", () => {
    const errors = {
      metadata: {
        title: createErrorObj("Title required"),
      },
    };
    const result = getSubfieldErrors(errors, {}, ["metadata.title"]);
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe("Title required");
  });

  it("finds nested error objects when path points to container", () => {
    const errors = {
      metadata: {
        creators: {
          0: { name: createErrorObj("Name required") },
          1: { name: createErrorObj("Name required too") },
        },
      },
    };
    const result = getSubfieldErrors(errors, {}, ["metadata.creators"]);
    expect(result).toHaveLength(2);
  });

  it("handles old format string errors", () => {
    const errors = {
      metadata: {
        title: "Title is required",
      },
    };
    const result = getSubfieldErrors(errors, {}, ["metadata.title"]);
    expect(result).toEqual(["Title is required"]);
  });

  it("finds old format errors in nested arrays", () => {
    const errors = {
      metadata: {
        additional_descriptions: [{ type: "Missing data for required field." }],
      },
    };
    const result = getSubfieldErrors(errors, {}, [
      "metadata.additional_descriptions",
    ]);
    expect(result).toEqual(["Missing data for required field."]);
  });

  it("handles mixed old format errors structure", () => {
    const errors = {
      metadata: {
        additional_descriptions: [{ type: "Missing data for required field." }],
        creators: "Missing data for required field.",
      },
      files: {
        enabled: "Missing uploaded files.",
      },
    };
    const result = getSubfieldErrors(errors, {}, [
      "metadata.additional_descriptions",
      "metadata.creators",
      "files.enabled",
    ]);
    expect(result).toHaveLength(3);
    expect(result).toContain("Missing data for required field.");
    expect(result).toContain("Missing uploaded files.");
  });

  it("falls back to initialErrors when errors is empty", () => {
    const initialErrors = {
      metadata: {
        title: createErrorObj("Initial error"),
      },
    };
    const result = getSubfieldErrors({}, initialErrors, ["metadata.title"]);
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe("Initial error");
  });

  it("prefers errors over initialErrors", () => {
    const errors = {
      metadata: { title: createErrorObj("Current error") },
    };
    const initialErrors = {
      metadata: { title: createErrorObj("Initial error") },
    };
    const result = getSubfieldErrors(errors, initialErrors, ["metadata.title"]);
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe("Current error");
  });

  it("handles multiple paths", () => {
    const errors = {
      metadata: {
        title: createErrorObj("Title error"),
        description: createErrorObj("Description error"),
      },
    };
    const result = getSubfieldErrors(errors, {}, [
      "metadata.title",
      "metadata.description",
    ]);
    expect(result).toHaveLength(2);
  });

  it("returns empty array for non-existent paths", () => {
    const errors = { metadata: { title: createErrorObj("Error") } };
    const result = getSubfieldErrors(errors, {}, ["metadata.nonexistent"]);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty includesPaths", () => {
    const errors = { metadata: { title: createErrorObj("Error") } };
    const result = getSubfieldErrors(errors, {}, []);
    expect(result).toEqual([]);
  });
});

describe("categorizeErrors", () => {
  const createErrorObj = (message, severity) => ({
    message,
    severity,
    description: `Description for ${message}`,
  });

  it("categorizes error severity correctly", () => {
    const errors = [createErrorObj("Error message", "error")];
    const result = categorizeErrors(errors);
    expect(result.error).toHaveLength(1);
    expect(result.warning).toHaveLength(0);
    expect(result.info).toHaveLength(0);
  });

  it("categorizes warning severity correctly", () => {
    const errors = [createErrorObj("Warning message", "warning")];
    const result = categorizeErrors(errors);
    expect(result.warning).toHaveLength(1);
    expect(result.error).toHaveLength(0);
    expect(result.info).toHaveLength(0);
  });

  it("categorizes info severity correctly", () => {
    const errors = [createErrorObj("Info message", "info")];
    const result = categorizeErrors(errors);
    expect(result.info).toHaveLength(1);
    expect(result.error).toHaveLength(0);
    expect(result.warning).toHaveLength(0);
  });

  it("categorizes mixed severities", () => {
    const errors = [
      createErrorObj("Error", "error"),
      createErrorObj("Warning", "warning"),
      createErrorObj("Info", "info"),
      createErrorObj("Another error", "error"),
    ];
    const result = categorizeErrors(errors);
    expect(result.error).toHaveLength(2);
    expect(result.warning).toHaveLength(1);
    expect(result.info).toHaveLength(1);
  });

  it("treats errors without severity as error category (old format)", () => {
    const errors = ["Old format error string"];
    const result = categorizeErrors(errors);
    expect(result.error).toHaveLength(1);
    expect(result.error[0]).toBe("Old format error string");
  });

  it("handles empty array", () => {
    const result = categorizeErrors([]);
    expect(result).toEqual({ info: [], warning: [], error: [] });
  });

  it("handles mixed old and new format errors", () => {
    const errors = [
      createErrorObj("New format error", "error"),
      "Old format error",
      createErrorObj("Warning", "warning"),
    ];
    const result = categorizeErrors(errors);
    expect(result.error).toHaveLength(2);
    expect(result.warning).toHaveLength(1);
  });
});

describe("mergeFieldData", () => {
  const modelData = {
    label: "Model Label",
    required: true,
    helpText: "Model Help",
    placeholder: "Model Placeholder",
  };

  it("returns model data when no overrides provided", () => {
    const result = mergeFieldData(modelData, {});
    expect(result).toEqual(modelData);
  });

  it("overrides model values with provided overrides", () => {
    const result = mergeFieldData(modelData, {
      label: "Custom Label",
      helpText: "Custom Help",
    });
    expect(result).toEqual({
      label: "Custom Label",
      required: true,
      helpText: "Custom Help",
      placeholder: "Model Placeholder",
    });
  });

  it("overrides model required=true with explicit false", () => {
    const result = mergeFieldData(modelData, { required: false });
    expect(result.required).toBe(false);
  });

  it("overrides model required=false with explicit true", () => {
    const modelWithFalseRequired = { ...modelData, required: false };
    const result = mergeFieldData(modelWithFalseRequired, { required: true });
    expect(result.required).toBe(true);
  });

  it("does not override when value is undefined", () => {
    const result = mergeFieldData(modelData, {
      label: undefined,
      required: undefined,
      helpText: undefined,
    });
    expect(result).toEqual(modelData);
  });

  it("allows overriding with empty string", () => {
    const result = mergeFieldData(modelData, { label: "" });
    expect(result.label).toBe("");
  });

  it("allows overriding with null", () => {
    const result = mergeFieldData(modelData, { label: null });
    expect(result.label).toBe(null);
  });

  it("allows overriding with zero", () => {
    const modelWithNumber = { ...modelData, count: 5 };
    const result = mergeFieldData(modelWithNumber, { count: 0 });
    expect(result.count).toBe(0);
  });

  it("adds new properties not in model", () => {
    const result = mergeFieldData(modelData, { newProp: "new value" });
    expect(result.newProp).toBe("new value");
    expect(result.label).toBe("Model Label");
  });

  it("handles empty model data", () => {
    const result = mergeFieldData({}, { label: "Custom", required: true });
    expect(result).toEqual({ label: "Custom", required: true });
  });

  it("does not mutate original model data", () => {
    const originalModel = { label: "Original", required: true };
    const result = mergeFieldData(originalModel, { label: "Modified" });
    expect(originalModel.label).toBe("Original");
    expect(result.label).toBe("Modified");
  });

  it("handles complex nested values in overrides", () => {
    const result = mergeFieldData(modelData, {
      label: { text: "Complex Label", icon: "star" },
    });
    expect(result.label).toEqual({ text: "Complex Label", icon: "star" });
  });
});
