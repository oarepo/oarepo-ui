// SPDX-FileCopyrightText: 2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import React from "react";
import { useSelector } from "react-redux";
import { RecordDeletion } from "@js/invenio_app_rdm/components/RecordDeletion";
import { useFormConfig } from "../../hooks";

/**
 * Whether the "Delete record" action applies, as in invenio-app-rdm ``RDMDepositForm``: the action
 * sits in the delete card (``permissions.can_delete_draft``) and only for a published record with
 * RDM record deletion enabled. Layouts use it to skip the action's wrapper (e.g. a grid column).
 */
export const useShowRecordDeletion = () => {
  const { permissions, recordDeletion } = useFormConfig();
  const record = useSelector((state) => state.deposit.record);
  return Boolean(
    permissions?.can_delete_draft &&
      record?.is_published &&
      recordDeletion?.enabled
  );
};

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
  const showRecordDeletion = useShowRecordDeletion();

  if (!showRecordDeletion) {
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
