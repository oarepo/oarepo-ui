# SPDX-FileCopyrightText: 2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Unit tests for ``RecordsUIResource._get_record_requests``."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import Mock

from flask import g
from invenio_access.permissions import system_identity
from invenio_rdm_records.services.services import RDMRecordService
from invenio_records_resources.services.records.results import RecordItem

from oarepo_ui.resources.records import resource as resource_module
from tests.simple_model import SimpleModelUIResource


def _record(parent: object | None) -> RecordItem:
    return Mock(spec=RecordItem, _record=SimpleNamespace(parent=parent))


def _rdm_service(monkeypatch) -> None:
    monkeypatch.setattr(SimpleModelUIResource, "api_service", property(lambda _self: Mock(spec=RDMRecordService)))


def test_record_requests_empty_for_non_rdm_service(app, simple_model_ui_resource, monkeypatch):
    # simple_model uses a plain drafts service -> no community requests, record_communities_service untouched
    communities_service = Mock()
    monkeypatch.setattr(
        resource_module, "current_rdm_records", SimpleNamespace(record_communities_service=communities_service)
    )
    with app.test_request_context():
        g.identity = system_identity
        assert simple_model_ui_resource._get_record_requests(_record(SimpleNamespace(communities=object()))) == {}
    communities_service.get_record_requests.assert_not_called()


def test_record_requests_empty_without_communities(app, simple_model_ui_resource, monkeypatch):
    _rdm_service(monkeypatch)
    with app.test_request_context():
        g.identity = system_identity
        assert simple_model_ui_resource._get_record_requests(_record(None)) == {}
        assert simple_model_ui_resource._get_record_requests(_record(SimpleNamespace())) == {}


def test_record_requests_rdm_service(app, simple_model_ui_resource, monkeypatch):
    _rdm_service(monkeypatch)
    communities_service = Mock()
    communities_service.get_record_requests.return_value = {"comm-id": "req-id"}
    monkeypatch.setattr(
        resource_module, "current_rdm_records", SimpleNamespace(record_communities_service=communities_service)
    )
    record = _record(SimpleNamespace(communities=object()))
    with app.test_request_context():
        g.identity = system_identity
        assert simple_model_ui_resource._get_record_requests(record) == {"comm-id": "req-id"}
    communities_service.get_record_requests.assert_called_once_with(system_identity, record)
