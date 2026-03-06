#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Mock second_model record model module for testing multiple models."""

from __future__ import annotations

from typing import ClassVar

from oarepo_ui.overrides import UIComponent, UIComponentImportMode
from oarepo_ui.resources.components import (
    AllowedHtmlTagsComponent,
    BabelComponent,
    FilesComponent,
    PermissionsComponent,
)
from oarepo_ui.resources.records.config import RecordsUIResourceConfig
from oarepo_ui.resources.records.resource import RecordsUIResource


class SecondModelUIResourceConfig(RecordsUIResourceConfig):
    """Mock UI resource config for the `second_model` records."""

    template_folder = "templates"
    url_prefix = "/second-model"
    blueprint_name = "second_model_ui"
    model_name = "second_model"

    search_component = UIComponent(
        "SecondModelResultsListItem",
        "@js/second-model/search/ResultsListItem",
        UIComponentImportMode.DEFAULT,
    )

    components: ClassVar[list] = [
        AllowedHtmlTagsComponent,
        BabelComponent,
        PermissionsComponent,
        FilesComponent,
    ]

    application_id: ClassVar[str] = "second_model"

    templates: ClassVar[dict[str, str]] = {
        "record_detail": "oarepo_ui.pages.RecordDetail",
        "search": "oarepo_ui.pages.RecordSearch",
        "deposit_edit": "oarepo_ui.pages.DepositEdit",
        "deposit_create": "oarepo_ui.pages.DepositCreate",
    }


class SecondModelUIResource(RecordsUIResource):
    """UI resource for second_model."""


def create_blueprint(app):
    """Register blueprint for this resource."""
    return SecondModelUIResource(SecondModelUIResourceConfig()).as_blueprint()
