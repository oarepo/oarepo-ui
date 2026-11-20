// SPDX-FileCopyrightText: 2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

/* eslint-disable react/prop-types -- minimal test doubles */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MonolithFormLayout } from "./BaseFormLayout";

let mockRecord = {};
let mockInitialRecord = {};
let mockFormConfig = {};

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: (selector) => selector({ deposit: { record: mockRecord } }),
}));

jest.mock("formik", () => ({
  ...jest.requireActual("formik"),
  useFormikContext: () => ({ values: {}, dirty: false, isSubmitting: false }),
}));

jest.mock("../../hooks", () => ({
  useFormConfig: () => mockFormConfig,
  useInitialRecord: () => ({ initialRecord: mockInitialRecord }),
  useSanitizeInput: () => ({ sanitizeInput: (value) => value }),
}));

jest.mock("@js/invenio_rdm_records", () => ({
  SaveButton: () => <button type="button">save</button>,
  PreviewButton: () => <button type="button">preview</button>,
  DeleteButton: () => (
    <button type="button" data-testid="delete-draft">
      delete
    </button>
  ),
}));

jest.mock(
  "@js/invenio_rdm_records/src/deposit/components/DepositStatus",
  () => ({ DepositStatusBox: () => <div /> })
);

jest.mock("@js/invenio_app_rdm/deposit/ShareDraftButton", () => ({
  ShareDraftButton: () => (
    <button type="button" data-testid="share-draft">
      share
    </button>
  ),
}));

jest.mock("@js/invenio_app_rdm/components/RecordDeletion", () => ({
  RecordDeletion: () => (
    <button type="button" data-testid="record-deletion">
      delete record
    </button>
  ),
}));

jest.mock("../PublishButton", () => ({
  PublishButton: () => <button type="button">publish</button>,
}));

jest.mock("../FormFeedback", () => ({ FormFeedback: () => <div /> }));
jest.mock("../FormikStateLogger", () => ({ FormikStateLogger: () => null }));
jest.mock("../TabForm", () => ({ TabForm: () => null }));

const render = ({
  record = { id: "abc", is_published: true },
  initialRecord = { id: "abc", is_draft: true },
  permissions = { can_delete_draft: true },
  recordDeletion,
} = {}) => {
  mockRecord = record;
  mockInitialRecord = initialRecord;
  mockFormConfig = {
    config: { vocabularies: {} },
    overridableIdPrefix: "Test",
    permissions,
    recordDeletion,
    groupsEnabled: false,
  };
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    <MonolithFormLayout record={record} overridableIdPrefix="Test" />
  );
  return container;
};

// width-16 columns of the actions grid that hold nothing
const emptyColumns = (container) =>
  Array.from(
    container.querySelectorAll("#control-panel .sixteen.wide.column")
  ).filter((column) => column.children.length === 0);

const byTestId = (container, id) =>
  container.querySelector(`[data-testid="${id}"]`);

describe("MonolithFormLayout actions", () => {
  it("renders no empty column when RDM record deletion is disabled", () => {
    const container = render({
      recordDeletion: { enabled: false, allowed: false },
    });
    expect(byTestId(container, "record-deletion")).toBeNull();
    expect(emptyColumns(container)).toHaveLength(0);
  });

  it("renders no empty column on the create page (no record deletion data)", () => {
    const container = render({
      record: {},
      initialRecord: {},
      recordDeletion: undefined,
    });
    expect(emptyColumns(container)).toHaveLength(0);
  });

  it("renders the record deletion action for a published record when enabled", () => {
    const container = render({
      recordDeletion: { enabled: true, allowed: true },
    });
    expect(byTestId(container, "record-deletion")).not.toBeNull();
    expect(emptyColumns(container)).toHaveLength(0);
  });

  it("hides the delete actions without the delete-draft permission", () => {
    const container = render({
      permissions: { can_delete_draft: false },
      recordDeletion: { enabled: true, allowed: true },
    });
    expect(byTestId(container, "delete-draft")).toBeNull();
    expect(byTestId(container, "record-deletion")).toBeNull();
    expect(emptyColumns(container)).toHaveLength(0);
  });

  it("offers sharing when is_draft is null (upstream condition)", () => {
    const container = render({
      record: { id: "abc", is_published: false },
      initialRecord: { id: "abc", is_draft: null },
    });
    expect(byTestId(container, "share-draft")).not.toBeNull();
  });

  it("offers sharing to record managers", () => {
    const container = render({
      permissions: { can_delete_draft: true, can_manage: true },
    });
    expect(byTestId(container, "share-draft")).not.toBeNull();
  });

  it("does not offer sharing otherwise", () => {
    const container = render();
    expect(byTestId(container, "share-draft")).toBeNull();
    expect(emptyColumns(container)).toHaveLength(0);
  });
});
