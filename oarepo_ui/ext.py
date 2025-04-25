import functools
import json
from pathlib import Path

from deepmerge import always_merger
from flask import Response, current_app
from flask_login import user_logged_in, user_logged_out
from flask_webpackext import current_manifest
from flask_webpackext.errors import ManifestKeyNotFoundError
from importlib_metadata import entry_points
from invenio_base.utils import obj_or_import_string
from markupsafe import Markup

import oarepo_ui.cli  # noqa
from oarepo_ui.resources.templating.catalog import OarepoCatalog as Catalog

from .proxies import current_optional_manifest
from .ui.components import DisabledComponent, FacetsWithVersionsToggle, UIComponent
from .utils import clear_view_deposit_page_permission_from_session


def _prefixed_ui_overrides(prefix: str, components: dict):
    return {f"{prefix}.{key}": value for key, value in components.items()}


class OARepoUIState:
    def __init__(self, app):
        self.app = app
        self._resources = []
        self.init_builder_plugin()
        self._catalog = None

    def optional_manifest(self, key):
        try:
            return current_manifest[key]
        except ManifestKeyNotFoundError as e:
            return Markup(f"<!-- Warn: {e} -->")

    def reinitialize_catalog(self):
        self._catalog = None
        try:
            del self.catalog  # noqa - this is a documented method of clearing the cache
        except (
            AttributeError
        ):  # but does not work if the cache is not initialized yet, thus the try/except
            pass

    @functools.cached_property
    def catalog(self):
        self._catalog = Catalog()
        return self._catalog_config(self._catalog, self.app.jinja_env)

    def _catalog_config(self, catalog, env):
        context = {}
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

        catalog.prefixes[""] = catalog.jinja_env.loader

        return catalog

    def register_resource(self, ui_resource):
        self._resources.append(ui_resource)

    def get_resources(self):
        return self._resources

    def init_builder_plugin(self):
        if self.app.config["OAREPO_UI_DEVELOPMENT_MODE"]:
            self.app.after_request(self.development_after_request)

    def development_after_request(self, response: Response):
        if current_app.config["OAREPO_UI_BUILD_FRAMEWORK"] == "vite":
            from oarepo_ui.vite import add_vite_tags

            return add_vite_tags(response)

    @property
    def record_actions(self) -> dict[str, str]:
        """
        Map of record actions to themselves. This is done to have the same
        handling for record actions and draft actions in the UI.
        """
        ret = self.app.config["OAREPO_UI_RECORD_ACTIONS"]
        if not isinstance(ret, dict):
            # convert to dict with action name as key and action name as value
            ret = {action: action for action in ret}
        return ret

    @property
    def draft_actions(self) -> dict[str, str]:
        """
        Map of draft actions to record actions. The keys are the draft actions
        and the values are the corresponding record actions.
        """
        return self.app.config["OAREPO_UI_DRAFT_ACTIONS"]

    @functools.cached_property
    def ui_models(self):
        # load all models from json files registered in oarepo.ui entry point
        ret = {}
        eps = entry_points(group="oarepo.ui")
        for ep in eps:
            path = Path(obj_or_import_string(ep.module).__file__).parent / ep.attr
            ret[ep.name] = json.loads(path.read_text())
        return ret

    @functools.cached_property
    def ui_overrides(self):
        # TODO: move to oarepo-global-search and respective libraries
        try:
            # Prepare model overrides for global-search apps if present
            from oarepo_global_search.proxies import current_global_search
        except ImportError:
            return current_app.config.get("UI_OVERRIDES", {})

        global_search_config = current_global_search.global_search_ui_resource.config

        global_search_result_items = {}

        for schema, search_component in global_search_config.default_components.items():
            if isinstance(search_component, UIComponent):
                global_search_result_items[schema] = search_component

        def _global_search_ui(app_name):
            return {
                f"{app_name}.Search.SearchApp.facets": FacetsWithVersionsToggle,
                **_prefixed_ui_overrides(
                    f"{app_name}.Search.ResultsList.item",
                    global_search_result_items,
                ),
            }

        # Runtime overrides for 3rd-party libraries UI
        runtime_overrides = {
            "oarepo_communities.community_records": _global_search_ui(
                "Community_records"
            ),
            "records_dashboard.search": _global_search_ui("Records_dashboard"),
            "global_search_ui.search": _global_search_ui("Global_search"),
            "oarepo_communities.members": {
                "InvenioCommunities.CommunityMembers.InvitationsModal": UIComponent(
                    "CommunityInvitationsModal", "@js/communities_components"
                )
            },
            "oarepo_communities.communities_settings": {
                "InvenioCommunities.CommunityProfileForm.GridRow.DangerZone": DisabledComponent
            },
        }

        if "UI_OVERRIDES" not in self.app.config:
            overrides = runtime_overrides
        else:
            overrides = always_merger.merge(
                runtime_overrides, self.app.config["UI_OVERRIDES"]
            )

        return overrides


class OARepoUIExtension:
    def __init__(self, app=None):
        if app:
            self.init_app(app)

    def init_app(self, app):
        self.init_config(app)
        app.extensions["oarepo_ui"] = OARepoUIState(app)
        user_logged_in.connect(clear_view_deposit_page_permission_from_session)
        user_logged_out.connect(clear_view_deposit_page_permission_from_session)
        app.add_template_global(current_optional_manifest, name="webpack_optional")

    def init_config(self, app):
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
