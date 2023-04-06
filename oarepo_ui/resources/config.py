import inspect
from pathlib import Path
from invenio_search_ui.searchconfig import SortConfig, FacetsConfig, SearchAppConfig
from flask_resources import (
    ResourceConfig,
)

from invenio_base.utils import obj_or_import_string

import marshmallow as ma


def _(x):
    """Identity function used to trigger string extraction."""
    return x


class UIResourceConfig(ResourceConfig):
    components = None
    template_folder = None

    def get_template_folder(self):
        if not self.template_folder:
            return None

        tf = Path(self.template_folder)
        if not tf.is_absolute():
            tf = (
                Path(inspect.getfile(type(self)))
                .parent.absolute()
                .joinpath(tf)
                .absolute()
            )
        return str(tf)

    response_handlers = {"text/html": None}
    default_accept_mimetype = "text/html"

    # Request parsing
    request_read_args = {}
    request_view_args = {}


class RecordsUIResourceConfig(UIResourceConfig):
    routes = {
        "search": "",
        "detail": "/<pid_value>",
        "export": "/<pid_value>/export/<export_format>",
    }
    request_view_args = {"pid_value": ma.fields.Str()}
    request_export_args = {"export_format": ma.fields.Str()}

    app_contexts = None
    ui_serializer = None
    ui_serializer_class = None
    api_service = None
    templates = {
        "detail": {
            "layout": "add-your-own-detail-template-to-site-or-ui-application.html.jinja2",
            "blocks": {},
        },
        "search": {
            "layout": "add-your-own-search-template-to-site-or-ui-application.html.jinja2"
        },
        "edit": {
            "layout": "add-your-own-edit-template-to-site-or-ui-application.html.jinja2"
        },
    }
    layout = "sample"

    @property
    def exports(self):
        return {
            "json": {
                "name": _("JSON"),
                "serializer": ("flask_resources.serializers:JSONSerializer"),
                "content-type": "application/json",
                "filename": "{id}.json",
            },
        }

    @property
    def ui_serializer(self):
        return obj_or_import_string(self.ui_serializer_class)()

    def search_available_facets(self, api_config, identity):
        return api_config.search.facets

    def search_available_sort_options(self, api_config, identity):
        return api_config.search.sort_options

    def search_active_facets(self, api_config, identity):
        return list([])

    def search_active_sort_options(self, api_config, identity):
        return list(api_config.search.sort_options.keys())

    def search_sort_config(
        self,
        available_options,
        selected_options=[],
        default_option=None,
        no_query_option=None,
    ):
        return SortConfig(
            available_options, selected_options, default_option, no_query_option
        )

    def search_facets_config(self, available_facets, selected_facets=[]):
        facets_config = {}
        for facet_key, facet in available_facets.items():
            facets_config[facet_key] = {
                "facet": facet,
                "ui": {
                    "field": facet._params.get("field", facet_key),
                },
            }

        return FacetsConfig(facets_config, selected_facets)

    def search_app_config(self, identity, api_config, overrides=None, **kwargs):
        opts = dict(
            endpoint=f"/api{api_config.url_prefix}",
            headers={"Accept": "application/vnd.inveniordm.v1+json"},
            grid_view=False,
            sort=self.search_sort_config(
                available_options=self.search_available_sort_options(
                    api_config, identity
                ),
                selected_options=self.search_active_sort_options(api_config, identity),
            ),
            facets=self.search_facets_config(
                available_facets=self.search_available_facets(api_config, identity),
                selected_facets=self.search_active_facets(api_config, identity),
            ),
        )
        opts.update(kwargs)
        overrides = overrides or {
            "ui_endpoint": self.url_prefix,
        }
        return SearchAppConfig.generate(opts, **overrides)
