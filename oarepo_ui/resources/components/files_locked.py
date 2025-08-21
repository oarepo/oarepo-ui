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

from typing import Any, override

from ..records.config import RecordsUIResourceConfig
from .base import UIResourceComponent


class FilesLockedComponent[T: RecordsUIResourceConfig = RecordsUIResourceConfig](UIResourceComponent[T]):
    """Add files locked to form config, to be able to use the same logic as in RDM."""

    @override
    def before_ui_create(
        self,
        *,
        form_config: dict,
        **kwargs: Any,
    ) -> None:
        """Set filesLocked to False before rendering the create page.

        :param record: UI-serialized record dictionary (unused for create).
        :param data: Empty API-serialized record data for the create form.
        :param identity: Current user identity.
        :param form_config: Form configuration dictionary to mutate in-place.
        :param ui_links: UI links for the page.
        :param extra_context: Extra context passed to the template.
        :returns: None
        :raises: None
        """
        form_config["filesLocked"] = False

    @override
    def before_ui_edit(
        self,
        *,
        record: dict,
        form_config: dict,
        extra_context: dict,
        **kwargs: Any,
    ) -> None:
        """Compute whether files should be locked before rendering the edit page.

        It sets filesLocked to True when the user cannot update files or when the
        record is already published. Otherwise, sets it to False.

        :param record: UI-serialized record with fields like "is_published".
        :param data: API-serialized record data.
        :param identity: Current user identity.
        :param form_config: Form configuration dictionary to mutate in-place.
        :param ui_links: UI links for the page.
        :param extra_context: Extra context expected to contain permissions.
        """
        form_config["filesLocked"] = not extra_context.get("permissions", {}).get(
            "can_update_files", False
        ) or record.get("is_published", False)
