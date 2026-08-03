#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Component that exposes whether files are locked in the form configuration.

This helps the UI reuse the same logic as Invenio RDM for enabling/disabling
file-related widgets during record create/edit flows.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, override

from oarepo_runtime.typing import record_from_result

from ..records.config import RecordsUIResourceConfig
from .base import UIResourceComponent

if TYPE_CHECKING:
    from invenio_records_resources.services.records.results import RecordItem


class FilesLockedComponent[T: RecordsUIResourceConfig = RecordsUIResourceConfig](UIResourceComponent[T]):
    """Drive the ``files_locked`` template value.

    Corresponds to the ``deposits-record-locked-files`` hidden input, to be able
    to use the same single-source logic as in RDM.

    The value is exposed only through the hidden input (read by ``parseFormAppConfig``
    as the top-level ``filesLocked`` prop), matching upstream RDM -- it is deliberately
    NOT duplicated into ``form_config`` (``deposits-config``), so the frontend has a
    single, unambiguous source of truth.
    """

    @override
    def before_ui_create(
        self,
        *,
        render_kwargs: dict,
        **kwargs: Any,
    ) -> None:
        """Files are never locked on the create page.

        :param render_kwargs: template render arguments to mutate in-place; the
            ``files_locked`` key is rendered into the ``deposits-record-locked-files``
            hidden input by ``form.html``.
        """
        render_kwargs["files_locked"] = False

    @override
    def before_ui_edit(
        self,
        *,
        api_record: RecordItem,
        render_kwargs: dict,
        **kwargs: Any,
    ) -> None:
        """Lock files purely by the draft's file-bucket lock.

        Using the bucket lock (instead of ``is_published`` or the ``can_update_files``
        permission) lets the file-modification grace-period flow work: once its request
        unlocks the bucket, the uploader becomes editable again on reload.

        Overrides the ``files_locked`` value the ``pass_draft`` decorator computed from
        ``lock_edit_published_files`` (which defaults to always-locked).

        :param api_record: The draft being edited.
        :param render_kwargs: template render arguments to mutate in-place; the
            ``files_locked`` key is rendered into the ``deposits-record-locked-files``
            hidden input by ``form.html``.
        """
        draft = record_from_result(api_record)
        bucket = getattr(getattr(draft, "files", None), "bucket", None)
        render_kwargs["files_locked"] = bool(getattr(bucket, "locked", False))
