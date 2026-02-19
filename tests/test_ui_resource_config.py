#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from flask_resources import MarshmallowSerializer
from invenio_access.permissions import system_identity
from invenio_search.engine import dsl
from oarepo_runtime import Model
from werkzeug.datastructures import MultiDict

from oarepo_ui.resources.records.config import SearchRequestArgsSchema

if TYPE_CHECKING:
    from typing import Any, ClassVar


def test_ui_resource_form_config(app, simple_model_ui_resource_config, simple_model_ui_resource):
    fc = simple_model_ui_resource_config.form_config()
    assert fc == {"overridableIdPrefix": "Simple_model.Form"}

    simple_model_ui_resource.run_components(
        "form_config",
        form_config=fc,
        layout="",
        resource=simple_model_ui_resource,
        api_record=None,
        record={},
        data={},
        identity=system_identity,
        extra_context={},
        ui_links=simple_model_ui_resource_config.ui_links_search,
    )

    assert "permissions" in fc
    assert "custom_fields" in fc


def test_request_schemas_are_marshmallow_schemas():
    schema = SearchRequestArgsSchema()
    md = MultiDict([("q", "test"), ("f", "a:1"), ("f", "b:2")])
    loaded = schema.load(md)
    assert "facets" in loaded
    assert loaded["facets"] == {"a": ["1"], "b": ["2"]}


def test_ui_links(simple_model_ui_resource_config):
    cfg = simple_model_ui_resource_config
    item_links = cfg.ui_links_item
    assert "self" in item_links
    assert "edit" in item_links
    assert "search" in item_links

    search_links = cfg.ui_links_search
    assert "deposit_create" in search_links
    assert any(k in search_links for k in ("prev", "next", "self"))


def test_model(simple_model_ui_resource_config, record_model):
    cfg = simple_model_ui_resource_config
    assert isinstance(cfg.model, Model)

    cfg.model_name = ""
    with pytest.raises(ValueError, match="Model name is not set in the resource configuration"):
        _ = cfg.model

    cfg.model_name = "un-registered"
    assert cfg.model is None


def test_ui_serializer(simple_model_ui_resource_config):
    cfg = simple_model_ui_resource_config
    cfg.model_name = "simple_model"

    assert isinstance(cfg.ui_serializer, MarshmallowSerializer)


def test_search_available_facets_and_active(simple_model_ui_resource_config):
    cfg = simple_model_ui_resource_config

    # Build a minimal dummy api_config.search with TermsFacet available
    class DummySearch:
        facets: ClassVar[dict[str, dsl.TermsFacet]] = {"a": dsl.TermsFacet(field="a")}
        params_interpreters_cls: ClassVar[list] = []

    class DummyConfig:
        search = DummySearch()

    facets = cfg.search_available_facets(DummyConfig(), system_identity)
    assert "a" in facets
    assert cfg.search_active_facets(DummyConfig(), system_identity) == ["a"]


def test_search_sort_and_active(simple_model_ui_resource_config):
    cfg = simple_model_ui_resource_config

    class DummySearch:
        sort_options: ClassVar[dict[str, dict]] = {"title": {"order": "asc"}}
        sort_default = "title"
        sort_default_no_query = "title"

    class DummyConfig:
        search = DummySearch()

    opts = cfg.search_available_sort_options(DummyConfig(), system_identity)
    assert "title" in opts
    assert cfg.search_active_sort_options(DummyConfig(), system_identity) == ["title"]

    sort_cfg = cfg.search_sort_config(opts, ["title"], "title", "title")
    from invenio_search_ui.searchconfig import SortConfig

    assert isinstance(sort_cfg, SortConfig)


def test_search_facets_config(simple_model_ui_resource_config):
    cfg = simple_model_ui_resource_config
    facets = {"a": dsl.TermsFacet(field="a")}
    fc = cfg.search_facets_config(facets)

    from invenio_search_ui.searchconfig import FacetsConfig

    assert isinstance(fc, FacetsConfig)

    rep = repr(fc)
    assert "a" in rep


def test_ignored_search_filters(simple_model_ui_resource_config):
    assert simple_model_ui_resource_config.ignored_search_filters() == ["allversions"]


def test_search_endpoint_url(simple_model_ui_resource_config):
    cfg = simple_model_ui_resource_config

    url = cfg.search_endpoint_url(system_identity)
    assert url.endswith("/api/simple-model")


def test_search_app_config(monkeypatch, simple_model_ui_resource_config):
    cfg = simple_model_ui_resource_config

    class DummyFacet:
        def __init__(self):
            self._params = {}
            self._label = "Label"

        def __call__(self, *args: Any, **kwargs: Any):  # noqa: ARG002
            return self

        def agg(self, *args: Any, **kwargs: Any) -> dict:  # noqa: ARG002
            return {}

    class DummySearch:
        facets: ClassVar[dict[str, Any]] = {"f1": DummyFacet()}
        params_interpreters_cls: ClassVar[list] = []
        sort_options: ClassVar[dict[str, dict]] = {
            "title": {
                "title": "Title",
                "fields": ["title"],
                "order": "asc",
            }
        }
        sort_default = "title"
        sort_default_no_query = "title"

    class DummyConfig:
        search = DummySearch()

    app_cfg = cfg.search_app_config(system_identity, DummyConfig())

    assert app_cfg["appId"] == "search"
    assert "initialQueryState" in app_cfg
    assert "searchApi" in app_cfg
    assert "sortOptions" in app_cfg
    assert "aggs" in app_cfg

    assert any(agg["aggName"] == "f1" for agg in app_cfg["aggs"])
    assert any(opt["sortBy"] == "title" for opt in app_cfg["sortOptions"])


def test_custom_fields(app, simple_model_ui_resource_config):
    cfg = simple_model_ui_resource_config
    ret = cfg.custom_fields()
    assert "ui" in list(ret)
    assert isinstance(ret["ui"], list)


def test_default_templates_config():
    """Test that default templates are set correctly in RecordsUIResourceConfig."""
    from oarepo_ui.resources.records.config import RecordsUIResourceConfig

    cfg = RecordsUIResourceConfig()
    # Default templates use page components from oarepo_ui.pages
    expected_templates: dict[str, str | None] = {
        "record_detail": "oarepo_ui.pages.RecordDetail",
        "search": "oarepo_ui.pages.RecordSearch",
        "deposit_edit": "oarepo_ui.pages.DepositEdit",
        "deposit_create": "oarepo_ui.pages.DepositCreate",
        "tombstone": "oarepo_ui.pages.Tombstone",
        "not_found": "oarepo_ui.pages.NotFound",
        "preview": None,
    }
    assert cfg.templates == expected_templates
