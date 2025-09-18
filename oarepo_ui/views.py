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

from flask import Blueprint
from flask_menu import current_menu
from invenio_base.utils import obj_or_import_string

if TYPE_CHECKING:
    from flask import Flask
    from flask.blueprints import BlueprintSetupState


def create_blueprint(app: Flask) -> Blueprint:
    """Create the OARepo UI blueprint to register templates, menu and filters."""
    blueprint = Blueprint("oarepo_ui", __name__, template_folder="templates", static_folder="static")
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


def finalize_app(app: Flask) -> None:
    """Finalize the UI application."""
    with app.app_context():
        # hide the /admin (maximum recursion depth exceeded menu)
        admin_menu = current_menu.submenu("settings.admin")
        admin_menu.hide()

        # Override webpack/rspack project from invenio-assets
        app.config["WEBPACKEXT_PROJECT"] = "oarepo_ui.webpack:project"
