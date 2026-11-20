# SPDX-FileCopyrightText: 2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Tests for landing-page custom fields (``custom_fields_ui``) on the record detail page."""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import Mock

from flask import g
from invenio_access.permissions import system_identity
from invenio_rdm_records.services.services import RDMRecordService

from oarepo_ui.resources.records import resource as resource_module
from oarepo_ui.resources.records.config import RecordsUIResourceConfig
from oarepo_ui.resources.records.resource import RecordsUIResource

if TYPE_CHECKING:
    from typing import Any

SECTIONS: list[dict[str, Any]] = [
    {
        "section": "Visible",
        "fields": [{"field": "custom_fields.cern:experiment", "props": {"label": "Experiment"}}],
    },
    {
        "section": "Hidden",
        "hide_from_landing_page": True,
        "fields": [{"field": "custom_fields.cern:secret", "props": {}}],
    },
]

RECORD_UI_WITH_CF: dict[str, Any] = {
    "custom_fields": {"cern:experiment": "CMS"},
    "ui": {"custom_fields": {"cern:experiment": "CMS"}},
}


class _StaticCustomFieldsConfig(RecordsUIResourceConfig):
    def custom_fields(self, **kwargs: Any) -> dict[str, Any]:
        return {"ui": SECTIONS}


def _rdm_service_mock():
    return property(lambda _self: Mock(spec=RDMRecordService))


def _rdm_fallback_sections() -> dict[str, Any]:
    return {"ui": [dict(SECTIONS[1]), {"section": "RDM", "fields": []}]}


def test_landing_page_custom_fields_filters_and_unprefixes():
    sections = _StaticCustomFieldsConfig().landing_page_custom_fields()
    assert [s["section"] for s in sections] == ["Visible"]
    assert sections[0]["fields"][0]["field"] == "cern:experiment"
    assert sections[0]["fields"][0]["props"] == {"label": "Experiment"}
    # source configuration is not mutated
    assert SECTIONS[0]["fields"][0]["field"] == "custom_fields.cern:experiment"


def test_landing_page_custom_fields_empty_for_model_without_cf(app, simple_model_ui_resource_config):
    assert simple_model_ui_resource_config.landing_page_custom_fields() == []
    assert simple_model_ui_resource_config.custom_fields_config_keys() == []


def test_custom_fields_ui_no_rdm_fallback_for_draft_service(app, simple_model_ui_resource, monkeypatch):
    load = Mock(side_effect=AssertionError("load_custom_fields must not be called for non-RDM services"))
    monkeypatch.setattr(resource_module, "load_custom_fields", load)
    with app.test_request_context():
        g.identity = system_identity
        assert simple_model_ui_resource._get_custom_fields_ui(Mock(), RECORD_UI_WITH_CF) == []
    load.assert_not_called()


def test_custom_fields_ui_falls_back_to_rdm_config(app, simple_model_ui_resource, monkeypatch):
    monkeypatch.setattr(resource_module, "load_custom_fields", _rdm_fallback_sections)
    monkeypatch.setattr(RecordsUIResource, "api_service", _rdm_service_mock())
    with app.test_request_context():
        g.identity = system_identity
        sections = simple_model_ui_resource._get_custom_fields_ui(Mock(), RECORD_UI_WITH_CF)
    assert [s["section"] for s in sections] == ["RDM"]


def test_custom_fields_ui_no_rdm_fallback_without_values(app, simple_model_ui_resource, monkeypatch):
    load = Mock(side_effect=AssertionError("no fallback without custom field values"))
    monkeypatch.setattr(resource_module, "load_custom_fields", load)
    monkeypatch.setattr(RecordsUIResource, "api_service", _rdm_service_mock())
    with app.test_request_context():
        g.identity = system_identity
        assert simple_model_ui_resource._get_custom_fields_ui(Mock(), {"custom_fields": {}, "ui": {}}) == []
    load.assert_not_called()


def test_custom_fields_ui_no_rdm_fallback_for_model_custom_fields(app, simple_model_ui_resource, monkeypatch):
    config_cls = type(simple_model_ui_resource.config)
    monkeypatch.setattr(config_cls, "custom_fields_config_keys", lambda _self: ["SIMPLE_MODEL_CUSTOM_FIELDS"])
    load = Mock(side_effect=AssertionError("model has its own custom fields, RDM config does not apply"))
    monkeypatch.setattr(resource_module, "load_custom_fields", load)
    monkeypatch.setattr(RecordsUIResource, "api_service", _rdm_service_mock())
    with app.test_request_context():
        g.identity = system_identity
        assert simple_model_ui_resource._get_custom_fields_ui(Mock(), RECORD_UI_WITH_CF) == []
    load.assert_not_called()


def test_custom_fields_ui_prefers_model_config(app, simple_model_ui_resource, monkeypatch):
    monkeypatch.setattr(type(simple_model_ui_resource.config), "custom_fields", lambda _self, **_kw: {"ui": SECTIONS})
    monkeypatch.setattr(resource_module, "load_custom_fields", Mock(side_effect=AssertionError("no fallback")))
    monkeypatch.setattr(RecordsUIResource, "api_service", _rdm_service_mock())
    with app.test_request_context():
        g.identity = system_identity
        sections = simple_model_ui_resource._get_custom_fields_ui(Mock(), RECORD_UI_WITH_CF)
    assert [s["section"] for s in sections] == ["Visible"]
    assert sections[0]["fields"][0]["field"] == "cern:experiment"


def test_custom_fields_ui_empty_when_ui_serialization_missing(app, simple_model_ui_resource, monkeypatch):
    monkeypatch.setattr(type(simple_model_ui_resource.config), "custom_fields", lambda _self, **_kw: {"ui": SECTIONS})
    load = Mock(side_effect=AssertionError("no fallback"))
    monkeypatch.setattr(resource_module, "load_custom_fields", load)
    monkeypatch.setattr(RecordsUIResource, "api_service", _rdm_service_mock())
    record_ui = {"custom_fields": {"cern:experiment": "CMS"}, "ui": {}}
    with app.test_request_context():
        g.identity = system_identity
        assert simple_model_ui_resource._get_custom_fields_ui(Mock(), record_ui) == []
    load.assert_not_called()
