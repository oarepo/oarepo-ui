// SPDX-FileCopyrightText: 2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

/* eslint-disable react/prop-types -- minimal test double of RecordDeletion */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RecordDeletionButton } from "./RecordDeletionButton";

let mockRecord = {};
let mockFormConfig = {};

jest.mock("react-redux", () => ({
  useSelector: (selector) => selector({ deposit: { record: mockRecord } }),
}));

jest.mock("../../hooks", () => ({
  useFormConfig: () => mockFormConfig,
}));

jest.mock("@js/invenio_app_rdm/components/RecordDeletion", () => ({
  RecordDeletion: ({ disabled, options, recordDeletion }) => (
    <button
      type="button"
      data-testid="record-deletion"
      data-options={JSON.stringify(options)}
      data-existing={recordDeletion.existing_request || ""}
      disabled={disabled}
    >
      Delete record
    </button>
  ),
}));

const REASONS = [{ text: "Duplicate of another record", value: "duplicate" }];

const setup = ({ record, recordDeletion, vocabularies }) => {
  mockRecord = record;
  mockFormConfig = {
    config: {
      vocabularies: vocabularies ?? {
        deletion_request_removal_reasons: REASONS,
      },
    },
    permissions: { can_delete_draft: true },
    recordDeletion,
  };
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<RecordDeletionButton />);
  return container;
};

const deletionButton = (container) =>
  container.querySelector('[data-testid="record-deletion"]');

describe("RecordDeletionButton", () => {
  it("renders an enabled action for a published record when deletion is allowed", () => {
    const container = setup({
      record: { id: "abc", is_published: true },
      recordDeletion: { enabled: true, allowed: true, valid_user: true },
    });
    const button = deletionButton(container);
    expect(button).not.toBeNull();
    expect(button.disabled).toBe(false);
    expect(JSON.parse(button.dataset.options)).toEqual(REASONS);
  });

  it("renders a disabled action when the deletion policy does not allow it", () => {
    const container = setup({
      record: { id: "abc", is_published: true },
      recordDeletion: { enabled: true, allowed: false, valid_user: false },
    });
    expect(deletionButton(container).disabled).toBe(true);
  });

  it("renders nothing when RDM record deletion is disabled", () => {
    const container = setup({
      record: { id: "abc", is_published: true },
      recordDeletion: { enabled: false, allowed: false, valid_user: false },
    });
    expect(deletionButton(container)).toBeNull();
  });

  it("renders nothing for a draft that was never published", () => {
    const container = setup({
      record: { id: "abc", is_published: false },
      recordDeletion: { enabled: true, allowed: true, valid_user: true },
    });
    expect(deletionButton(container)).toBeNull();
  });

  it("renders nothing when the page has no record deletion data (create page)", () => {
    const container = setup({ record: {}, recordDeletion: undefined });
    expect(deletionButton(container)).toBeNull();
  });

  it("falls back to no removal reasons when the vocabulary is missing", () => {
    const container = setup({
      record: { id: "abc", is_published: true },
      recordDeletion: { enabled: true, allowed: true, valid_user: true },
      vocabularies: {},
    });
    expect(JSON.parse(deletionButton(container).dataset.options)).toEqual([]);
  });
});
