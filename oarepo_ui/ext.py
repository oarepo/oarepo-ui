#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI extension module.

This module contains the main Flask extension for OARepo UI, which provides
user interface functionality for OARepo repositories. It includes state management,
catalog configuration, resource registration, and UI component overrides.
"""

from __future__ import annotations

import contextlib
import warnings
from collections import defaultdict
from functools import cached_property
from typing import TYPE_CHECKING, Any, cast

from flask import current_app
from flask_login import user_logged_in, user_logged_out
from flask_webpackext import current_manifest
from flask_webpackext.errors import ManifestKeyNotFoundError
from jinja2 import FileSystemLoader
from markupsafe import Markup

from oarepo_ui.templating.catalog import OarepoCatalog as Catalog

from .proxies import current_optional_manifest
from .utils import clear_view_deposit_page_permission_from_session

if TYPE_CHECKING:
    from flask import Flask
    from jinja2 import Environment

    from oarepo_ui.resources.records.resource import UIResource

    from .ui.components import UIComponent, UIComponentOverride


class OARepoUIState:
    """API for the OARepo UI extension."""

    def __init__(self, app: Flask) -> None:
        """Initialize the OARepo UI state."""
        if not app:
            raise ValueError("OARepoUIState must be initialized with a Flask app instance")
        self.app = app
        self._resources: list[UIResource] = []
        self._catalog: Catalog | None = None

    def optional_manifest(self, key: str) -> str | Markup:
        """Get an optional manifest entry by key."""
        try:
            return current_manifest[key]
        except ManifestKeyNotFoundError as e:
            if self.app.debug:
                return Markup("<!-- Overridable %s not found: %s -->") % (key, e)
            return ""

    def reinitialize_catalog(self) -> None:
        """Reinitialize the JinjaX catalog."""
        self._catalog = None
        with contextlib.suppress(AttributeError):
            del self.catalog

    @cached_property
    def catalog(self) -> Catalog:
        """Get the JinjaX catalog for OARepo UI. The catalog is cached and reused."""
        self._catalog = Catalog()
        self._catalog_config(self._catalog, self.app.jinja_env)
        return self._catalog

    def _catalog_config(self, catalog: Catalog, env: Environment) -> None:
        """Configure the JinjaX catalog for OARepo UI."""
        context: dict[str, Any] = {}
        env.policies.setdefault("json.dumps_kwargs", {}).setdefault("default", str)
        self.app.update_template_context(context)
        catalog.jinja_env.loader = env.loader

        # autoescape everything (this catalogue is used just for html jinjax components, so can do that) ...
        catalog.jinja_env.autoescape = True

        context.update(catalog.jinja_env.globals)
        context.update(env.globals)
        catalog.jinja_env.globals = context
        catalog.jinja_env.extensions.update(env.extensions)
        catalog.jinja_env.filters.update(env.filters)
        catalog.jinja_env.policies.update(env.policies)

        # replace the jinjax default loader
        if not isinstance(catalog.jinja_env.loader, FileSystemLoader):
            warnings.warn(
                f"JinjaX default loader should be an instance of FileSystemLoader "
                f"but is {type(catalog.jinja_env.loader)}. Expect problems.",
                stacklevel=2,
            )
        catalog.prefixes[""] = cast("FileSystemLoader", catalog.jinja_env.loader)

    def register_resource(self, ui_resource: UIResource) -> None:
        """Register a UI resource."""
        self._resources.append(ui_resource)

    def get_resources(self) -> list[UIResource]:
        """Get all registered UI resources."""
        return self._resources

    @cached_property
    def record_actions(self) -> dict[str, str]:
        """Get the mapping of api permissions (actions) to UI permission flags.

        This is normally an identity for the published record actions, but can be
        used to map to custom actions.
        """
        ret = self.app.config["OAREPO_UI_RECORD_ACTIONS"]
        if not isinstance(ret, dict):
            # convert to dict with action name as key and action name as value
            ret = {action: action for action in ret}
        return ret

    @cached_property
    def draft_actions(self) -> dict[str, str]:
        """Get the mapping of api permissions (actions) to UI permission flags for drafts.

        This maps the actions that are available for drafts, such as delete_draft,
        to the same ui permission flags as the published record actions (delete in this case).
        """
        return cast("dict[str, str]", self.app.config["OAREPO_UI_DRAFT_ACTIONS"])

    @cached_property
    def ui_overrides(self) -> set[UIComponentOverride]:
        """Get the UI overrides for the current app."""
        return cast("set[UIComponentOverride]", current_app.config.get("OAREPO_UI_OVERRIDES", {}))

    @property
    def ui_overrides_by_endpoint(self) -> dict[str, set[UIComponentOverride]]:
        """Get the UI overrides for the app, grouped by Flask Blueprint endpoint."""
        endpoint_overrides: dict[str, set[UIComponentOverride]] = defaultdict(set)

        for component_override in self.ui_overrides:
            endpoint_overrides[component_override.endpoint].add(component_override)

        return cast("dict[str, set[UIComponentOverride]]", endpoint_overrides)

    def register_result_list_item(self, schema: str, component: UIComponent) -> None:
        """Register a result list item javascript component.

        The component will be automatically registered to the correct overridables so
        that it is displayed on search results, dashboard and other search pages.

        :param schema: jsonschema of the record that should be displayed by the component
        :param component: the component to register
        """
        with self.app.app_context():
            for registration_callback in self.app.config.get("OAREPO_UI_RESULT_LIST_ITEM_REGISTRATION_CALLBACK", []):
                if callable(registration_callback):
                    registration_callback(self.ui_overrides, schema, component)
                else:
                    raise TypeError(f"Registration callback {registration_callback} is not callable.")


class OARepoUIExtension:
    """Flask extension for OARepo UI."""

    def __init__(self, app: Flask | None = None) -> None:
        """Initialize the OARepo UI extension."""
        if app:
            self.init_app(app)

    def init_app(self, app: Flask) -> None:
        """Initialize the OARepo UI extension with the Flask app."""
        self.init_config(app)
        app.extensions["oarepo_ui"] = OARepoUIState(app)
        user_logged_in.connect(clear_view_deposit_page_permission_from_session)
        user_logged_out.connect(clear_view_deposit_page_permission_from_session)
        app.add_template_global(current_optional_manifest, name="webpack_optional")

    def init_config(self, app: Flask) -> None:
        """Initialize configuration."""
        from . import config

        for k in dir(config):
            if k.startswith("OAREPO_UI_"):
                app.config.setdefault(k, getattr(config, k))

        # merge in default filters and globals if they have not been overridden
        for k in ("OAREPO_UI_JINJAX_FILTERS", "OAREPO_UI_JINJAX_GLOBALS"):
            for name, val in getattr(config, k).items():
                if name not in app.config[k]:
                    app.config[k][name] = val

        app.config.setdefault("MATOMO_ANALYTICS_TEMPLATE", config.MATOMO_ANALYTICS_TEMPLATE)

        # set the version, should be overriden in INVENIO_DEPLOYMENT_VERSION
        # in K8s cluster
        app.config.setdefault("DEPLOYMENT_VERSION", "local development")
