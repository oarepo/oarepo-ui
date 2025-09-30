#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
import pytest
from flask_menu import current_menu
from invenio_i18n import gettext as _

from oarepo_ui.overrides import UIComponent, UIComponentImportMode
from oarepo_ui.proxies import current_oarepo_ui
from oarepo_ui.resources.components import (
    AllowedHtmlTagsComponent,
    BabelComponent,
    CustomFieldsComponent,
    EmptyRecordAccessComponent,
    FilesComponent,
    FilesLockedComponent,
    FilesQuotaAndTransferComponent,
    PermissionsComponent,
    RecordRestrictionComponent,
)
from oarepo_ui.resources.records.config import RecordsUIResourceConfig
from oarepo_ui.resources.records.resource import RecordsUIResource
from oarepo_ui.utils import can_view_deposit_page


class SimpleModelUIResourceConfig(RecordsUIResourceConfig):
    template_folder = "templates"
    url_prefix = "/simple-model"
    blueprint_name = "simple_model_ui"
    model_name = "simple_model"

    search_component = UIComponent(
        "SimpleModelResultsListItem",
        "@js/simple-model/search/ResultsListItem",
        UIComponentImportMode.DEFAULT,
    )

    components = [
        AllowedHtmlTagsComponent,
        BabelComponent,
        PermissionsComponent,
        FilesComponent,
        CustomFieldsComponent,
        RecordRestrictionComponent,
        EmptyRecordAccessComponent,
        FilesLockedComponent,
        FilesQuotaAndTransferComponent,
    ]

    try:
        from oarepo_vocabularies.ui.resources.components import (
            DepositVocabularyOptionsComponent,
        )

        components.append(DepositVocabularyOptionsComponent)
    except ImportError:
        pass

    application_id = "simple_model"

    templates = {
        "record_detail": "simple_model.RecordDetail",
        "search": "simple_model.Search",
        "deposit_edit": "simple_model.TestDepositEdit",
        "deposit_create": "simple_model.TestDepositCreate",
    }


class SimpleModelUIResource(RecordsUIResource):
    """UI resource for simple_model."""


def ui_overrides(app):
    """Register UI overrides."""
    ui_resource_config = SimpleModelUIResourceConfig()

    if (
        current_oarepo_ui is not None
        and ui_resource_config.model.record_json_schema
        and ui_resource_config.search_component
    ):
        current_oarepo_ui.register_result_list_item(
            ui_resource_config.model.record_json_schema,
            ui_resource_config.search_component,
        )


def init_menu(app):
    """Initialize menu before first request."""
    with app.app_context():
        current_menu.submenu("plus.create_simple_model").register(
            "simple_model.create",
            _("New Simple Model"),
            order=1,
            visible_when=can_view_deposit_page,
        )


def finalize_app(app):
    """Finalize app."""
    init_menu(app)
    ui_overrides(app)


def create_blueprint(app):
    """Register blueprint for this resource."""
    blueprint = SimpleModelUIResource(SimpleModelUIResourceConfig()).as_blueprint()
    return blueprint


# Optional pytest fixture to auto-load this mock module
@pytest.fixture(scope="module")
def simple_model_ui_module():
    """Provide the simple_model UI mock module for testing."""
    return {
        "invenio_base.blueprints": ["simple_model = tests.mock_simple_model_ui:create_blueprint"],
        "invenio_base.finalize_app": ["simple_model = tests.mock_simple_model_ui:finalize_app"],
    }
