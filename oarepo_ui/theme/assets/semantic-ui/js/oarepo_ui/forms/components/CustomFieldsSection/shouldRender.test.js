import {
  CUSTOM_FIELDS_SECTION_KEY,
  shouldRenderCustomFieldsSection,
} from "./shouldRender";

describe("shouldRenderCustomFieldsSection", () => {
  const sections = [{ key: "metadata", label: "Metadata" }];

  it("returns true when custom fields are configured and no such section exists", () => {
    const config = { custom_fields: { ui: [{ section: "s", fields: [] }] } };
    expect(shouldRenderCustomFieldsSection(sections, config)).toBe(true);
  });

  it("returns false when no custom fields are configured", () => {
    expect(shouldRenderCustomFieldsSection(sections, {})).toBe(false);
    expect(
      shouldRenderCustomFieldsSection(sections, { custom_fields: {} })
    ).toBe(false);
    expect(
      shouldRenderCustomFieldsSection(sections, { custom_fields: { ui: [] } })
    ).toBe(false);
  });

  it("returns false when a custom-fields section is already present (opt-out)", () => {
    const manual = [{ key: CUSTOM_FIELDS_SECTION_KEY, label: "My own CF tab" }];
    const config = { custom_fields: { ui: [{ section: "s", fields: [] }] } };
    expect(shouldRenderCustomFieldsSection(manual, config)).toBe(false);
  });

  it("accepts null/undefined sections", () => {
    const config = { custom_fields: { ui: [{ section: "s", fields: [] }] } };
    expect(shouldRenderCustomFieldsSection(undefined, config)).toBe(true);
    expect(shouldRenderCustomFieldsSection(null, config)).toBe(true);
  });
});
