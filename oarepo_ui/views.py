#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI views module.

This module contains Flask blueprint creation and view functions for OARepo UI,
including blueprint setup, menu initialization, Jinja filter registration,
and notification settings handling.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import Blueprint, current_app, render_template
from flask_menu import current_menu
from invenio_app_rdm.views import create_url_rule
from invenio_base.utils import obj_or_import_string
from invenio_i18n import get_locale
from invenio_sitemap import iterate_urls_of_sitemap_indices

from oarepo_ui.overrides import (
    UIComponent,
    UIComponentOverride,
)
from oarepo_ui.overrides.components import UIComponentImportMode
from oarepo_ui.proxies import current_ui_overrides

if TYPE_CHECKING:
    from flask import Flask
    from flask.blueprints import BlueprintSetupState
    from flask.typing import ResponseReturnValue


def create_blueprint(app: Flask) -> Blueprint:
    """Create the OARepo UI blueprint to register templates, menu and filters."""
    routes = app.config.get("APP_RDM_ROUTES")
    blueprint = Blueprint("oarepo_ui", __name__, template_folder="templates", static_folder="static")

    if routes:
        blueprint.add_url_rule(**create_url_rule(routes.get("index"), default_view_func=index))
        blueprint.add_url_rule(**create_url_rule(routes.get("robots"), default_view_func=robots))
        blueprint.add_url_rule(**create_url_rule(routes.get("help_search"), default_view_func=help_search))

    blueprint.app_context_processor(lambda: ({"current_app": app}))

    def add_jinja_filters(state: BlueprintSetupState) -> None:
        app = state.app

        # this is the case for <Flask InvenioAppsUrlsBuilder>
        if "oarepo_ui" not in app.extensions:
            return

        ext = app.extensions["oarepo_ui"]

        # modified the global env - not pretty, but gets filters to search as well
        env = app.jinja_env
        env.filters.update({k: obj_or_import_string(v) for k, v in app.config["OAREPO_UI_JINJAX_FILTERS"].items()})
        env.globals.update({k: obj_or_import_string(v) for k, v in app.config["OAREPO_UI_JINJAX_GLOBALS"].items()})
        env.policies.setdefault("json.dumps_kwargs", {}).setdefault("default", str)

        # the catalogue should not have been used at this point but if it was, we need to reinitialize it
        ext.reinitialize_catalog()

    blueprint.record_once(add_jinja_filters)

    return blueprint


# Common UI views
def index() -> ResponseReturnValue:
    """Frontpage."""
    return render_template(
        current_app.config["THEME_FRONTPAGE_TEMPLATE"],
        show_intro_section=current_app.config["THEME_SHOW_FRONTPAGE_INTRO_SECTION"],
    )


def robots() -> ResponseReturnValue:
    """Robots.txt."""
    return render_template(
        "invenio_app_rdm/robots.txt",
        urls_of_sitemap_indices=iterate_urls_of_sitemap_indices(),
    )


def help_search() -> ResponseReturnValue:
    """Search help guide."""
    # Default to rendering english page if locale page not found.
    locale = get_locale()
    return render_template(
        [
            f"invenio_app_rdm/help/search.{locale}.html",
            "invenio_app_rdm/help/search.en.html",
        ]
    )


def ui_overrides(app: Flask) -> None:  # NOQA: ARG001
    """Define overrides that this library will register."""
    dynamic_result_list_item = UIComponent(
        "DynamicResultsListItem",
        "@js/oarepo_ui/search/DynamicResultsListItem",
        UIComponentImportMode.DEFAULT,
    )
    dynamic_main_search_result_list_item_override = UIComponentOverride(
        "invenio_search_ui.search",
        "InvenioAppRdm.Search.ResultsList.item",
        dynamic_result_list_item,
    )
    if dynamic_main_search_result_list_item_override not in current_ui_overrides:
        current_ui_overrides.add(dynamic_main_search_result_list_item_override)

    home_page_record_list = UIComponent(
        "RecordsList",
        "@js/oarepo_ui/search/RecordsList",
        UIComponentImportMode.NAMED,
    )
    home_page_records_list_override = UIComponentOverride(
        "oarepo_ui.index",
        "InvenioAppRDM.RecordsList.layout",
        home_page_record_list,
    )
    if home_page_records_list_override not in current_ui_overrides:
        current_ui_overrides.add(home_page_records_list_override)


def _register_main_search_result_item(
    ui_overrides: set[UIComponentOverride], schema: str, component: UIComponent
) -> None:
    """Register a result list items for dashboard uploads."""
    main_search_result_list_item = UIComponentOverride(
        "invenio_search_ui.search",
        f"InvenioAppRdm.Search.ResultsList.item.{schema}",
        component,
    )
    if main_search_result_list_item not in ui_overrides:
        ui_overrides.add(main_search_result_list_item)


def _register_home_page_search_result_item(
    ui_overrides: set[UIComponentOverride], schema: str, component: UIComponent
) -> None:
    """Register a result list for home page records list."""
    home_page_result_list_item = UIComponentOverride(
        "oarepo_ui.index",
        f"InvenioAppRDM.RecordsList.ResultsList.item.{schema}",
        component,
    )
    if home_page_result_list_item not in ui_overrides:
        ui_overrides.add(home_page_result_list_item)


def finalize_app(app: Flask) -> None:
    """Finalize the UI application."""
    ui_overrides(app)
    with app.app_context():
        # hide the /admin (maximum recursion depth exceeded menu)
        admin_menu = current_menu.submenu("settings.admin")
        admin_menu.hide()

        # Override webpack/rspack project from invenio-assets
        app.config["WEBPACKEXT_PROJECT"] = "oarepo_ui.webpack:project"
