#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Component that injects UI custom fields configuration into form config.

This module defines a component which, when the resource config exposes a
``custom_fields`` callable, populates the form configuration with the rendered
custom fields for the current identity and record context.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, override

from oarepo_ui.resources.components import UIResourceComponent

from ..records.config import RecordsUIResourceConfig

if TYPE_CHECKING:
    from flask_principal import Identity
    from invenio_records_resources.services.records.results import RecordItem


class CustomFieldsComponent[T: RecordsUIResourceConfig = RecordsUIResourceConfig](UIResourceComponent[T]):
    """Populate form configuration with UI-ready custom fields.

    The component relies on ``resource.config.custom_fields`` to generate the
    fields schema or configuration appropriate for the UI.
    """

    @override
    def form_config(
        self,
        *,
        api_record: RecordItem | None = None,
        record: dict | None = None,
        identity: Identity,
        form_config: dict,
        ui_links: dict | None = None,
        extra_context: dict | None = None,
        **_kwargs: Any,
    ) -> None:
        """Fill ``form_config['custom_fields']`` if configured on the resource.

        :param api_record: API record being edited, or None when creating.
        :param record: UI-serialized record dictionary, or None when creating.
        :param identity: Current user identity.
        :param form_config: Form configuration dictionary to mutate in-place.
        :param ui_links: Optional UI links dictionary.
        :param extra_context: Optional extra context dictionary.
        """
        if hasattr(self.resource.config, "custom_fields"):
            form_config["custom_fields"] = self.resource.config.custom_fields(
                identity=identity,
                api_record=api_record,
                record=record,
                form_config=form_config,
                ui_links=ui_links,
                extra_context=extra_context,
            )
