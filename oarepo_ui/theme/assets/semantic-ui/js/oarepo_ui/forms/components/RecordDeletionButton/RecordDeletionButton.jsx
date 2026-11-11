// SPDX-FileCopyrightText: 2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import React from "react";
import { useSelector } from "react-redux";
import { RecordDeletion } from "@js/invenio_app_rdm/components/RecordDeletion";
import { useFormConfig } from "../../hooks";

/**
 * "Delete record" action of the deposit form (invenio-app-rdm v14 parity).
 *
 * Mirrors the deposit sidebar of invenio-app-rdm ``RDMDepositForm``: shown only while editing a
 * published record when RDM record deletion is enabled (``deposits-record-deletion``), disabled
 * when the policy does not allow the current user to delete. The removal reasons come from the
 * form config vocabularies, exactly as upstream.
 */
export const RecordDeletionButton = (props) => {
  const { config, permissions, recordDeletion } = useFormConfig();
  const record = useSelector((state) => state.deposit.record);

  if (!record?.is_published || !recordDeletion?.enabled) {
    return null;
  }

  return (
    <RecordDeletion
      record={record}
      permissions={permissions ?? {}}
      recordDeletion={recordDeletion}
      options={config?.vocabularies?.deletion_request_removal_reasons ?? []}
      disabled={!recordDeletion.allowed}
      {...props}
    />
  );
};
