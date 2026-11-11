# SPDX-FileCopyrightText: 2025-2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Utility functions for handling API records in Flask responses and deposit form helpers."""

from __future__ import annotations

from copy import deepcopy
from typing import TYPE_CHECKING, Any, cast

from flask import current_app
from invenio_app_rdm.records_ui.utils import evaluate_quota_increase
from invenio_rdm_records.records.api import get_files_quota

if TYPE_CHECKING:
    from flask_principal import Identity
    from invenio_rdm_records.records.api import RDMRecord
    from invenio_records.api import Record
    from invenio_records_resources.services.records.results import RecordItem
    from werkzeug import Response


DISABLED_QUOTA_INCREASE: dict[str, Any] = {"enabled": False, "valid_user": False, "allowed": False}
"""``quotaIncrease`` used for non-RDM models, which have no RDM quota increase endpoint.

The RDM ``FileUploader`` calls ``Object.keys(quota.quotaIncrease)`` unconditionally, so the key must
always be present in the form config quota.
"""


def _non_rdm_default_files_quota() -> dict[str, Any]:
    """Return the quota a non-RDM files bucket is created with.

    Plain oarepo-model ``FilesField`` buckets get the invenio-files-rest ``Bucket`` column defaults
    (``FILES_REST_DEFAULT_*``), not ``RDMUserQuota``/``RDM_FILES_DEFAULT_*``. The RDM values are only
    a fallback so that ``maxStorage`` is never ``None`` (the uploader compares ``size > maxStorage``
    and ``x > null`` is true in JavaScript, which would reject every upload).
    """
    conf = current_app.config
    return {
        "quota_size": conf.get("FILES_REST_DEFAULT_QUOTA_SIZE") or conf.get("RDM_FILES_DEFAULT_QUOTA_SIZE"),
        "max_file_size": conf.get("FILES_REST_DEFAULT_MAX_FILE_SIZE") or conf.get("RDM_FILES_DEFAULT_MAX_FILE_SIZE"),
    }


def _get_actual_files_quota(record: Record | None, *, rdm: bool) -> dict[str, Any]:
    """Return the effective ``{quota_size, max_file_size}`` of a draft (RDM ``get_actual_files_quota``).

    Unlike the upstream helper this tolerates records without a files bucket and calls the
    RDM-specific ``get_files_quota`` (``RDMUserQuota``/``RDMRecordQuota`` and
    ``parent.access.owned_by``) only for RDM services.

    :param record: The draft record, or None when creating a new draft.
    :param rdm: Whether the record belongs to an RDM service.
    :return: Quota dictionary with ``quota_size`` and ``max_file_size`` keys.
    """
    bucket = getattr(record, "bucket", None) if record is not None else None
    if bucket is not None:
        quota = {"quota_size": bucket.quota_size, "max_file_size": bucket.max_file_size}
        if not rdm:
            # plain oarepo-model buckets are created with FILES_REST_DEFAULT_* (None by default)
            defaults = _non_rdm_default_files_quota()
            for key, value in quota.items():
                if value is None:
                    quota[key] = defaults[key]
        return quota
    if rdm:
        return get_files_quota(None if record is None else cast("RDMRecord", record))
    return _non_rdm_default_files_quota()


def get_form_files_quota(record: Record | None, identity: Identity, *, rdm: bool) -> dict[str, Any]:
    """Build the deposit form ``quota`` config in the shape of RDM v14 ``get_form_config``.

    Starts from ``APP_RDM_DEPOSIT_FORM_QUOTA`` (e.g. ``maxFiles``) and always sets ``maxStorage``,
    ``maxFileSize`` and ``quotaIncrease``. The record/bucket quota takes precedence over the
    configured ``RDM_FILES_DEFAULT_MAX_FILE_SIZE``.

    :param record: The draft record being edited, or None when creating.
    :param identity: Current user identity.
    :param rdm: Whether the model service is an RDM service. The quota increase policy is only
        evaluated for RDM services: oarepo-config enables ``RDM_IMMEDIATE_QUOTA_INCREASE_ENABLED`` by
        default, and a non-RDM service has no ``quota_increase`` endpoint behind the "Manage storage" UI.
    :return: Quota dictionary for ``form_config["quota"]``.
    """
    conf = current_app.config
    quota: dict[str, Any] = deepcopy(conf.get("APP_RDM_DEPOSIT_FORM_QUOTA", {}))
    max_file_size = conf.get("RDM_FILES_DEFAULT_MAX_FILE_SIZE", None)
    record_quota = _get_actual_files_quota(record, rdm=rdm)
    quota["maxStorage"] = record_quota["quota_size"]
    quota["maxFileSize"] = record_quota.get("max_file_size") or max_file_size
    if rdm:
        quota["quotaIncrease"] = evaluate_quota_increase(record, identity)
    else:
        quota["quotaIncrease"] = dict(DISABLED_QUOTA_INCREASE)
    return quota


def set_api_record_to_response(response: Response, api_record: RecordItem) -> Response:
    """Set the API record to the response object."""
    # flask/werkzeug responses have no typed slot for arbitrary payloads
    vars(response)["_api_record"] = api_record
    return response


def get_api_record_from_response(response: Response) -> RecordItem | None:
    """Get the API record from the response object."""
    return getattr(response, "_api_record", None)
