# SPDX-FileCopyrightText: 2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Tests for record deletion evaluation in RecordsUIResource."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from flask import g, render_template
from invenio_rdm_records.services.request_policies import PolicyEvaluator
from invenio_records_resources.services.records.results import RecordItem

import oarepo_ui.resources.records.resource as resource_module


def _api_record() -> RecordItem:
    return Mock(spec=RecordItem, _record=SimpleNamespace(), id="abcd-1234")


def test_record_deletion_non_rdm_service(app, simple_model_ui_resource):
    # simple_model uses a plain drafts service (records_resources + drafts presets) -> nothing RDM is called
    assert simple_model_ui_resource._evaluate_record_deletion(_api_record()) == ({}, [])


@pytest.mark.parametrize(
    ("allowed", "expected_options"),
    [(True, [{"text": "Spam", "value": "spam"}]), (False, [])],
)
def test_record_deletion_rdm_service(app, users, simple_model_ui_resource, monkeypatch, allowed, expected_options):
    evaluated = {"enabled": True, "valid_user": True, "allowed": allowed, "existing_request": None}
    evaluate = Mock(return_value=dict(evaluated))
    vocab = Mock()
    vocab.return_value.deletion_request_removal_reasons.return_value = [{"text": "Spam", "value": "spam"}]
    # pretend the simple_model service is an RDM service
    monkeypatch.setattr(resource_module, "RDMRecordService", type(simple_model_ui_resource.api_service))
    monkeypatch.setattr(resource_module, "evaluate_record_deletion", evaluate)
    monkeypatch.setattr(resource_module, "VocabulariesOptions", vocab)

    api_record = _api_record()
    with app.test_request_context():
        g.identity = users[0].identity
        deletion, options = simple_model_ui_resource._evaluate_record_deletion(api_record)

    assert deletion == evaluated
    assert options == expected_options
    evaluate.assert_called_once_with(api_record._record, users[0].identity)
    assert vocab.called is allowed


def test_record_deletion_policy_results_flattened(app, users, simple_model_ui_resource, monkeypatch):
    policy = {"id": "grace-period-v1", "description": "x"}
    evaluated = {
        "enabled": True,
        "valid_user": True,
        "allowed": True,
        "recordDeletion": {
            "immediate_deletion": PolicyEvaluator.Result(enabled=True, valid_user=True, allowed=True, policy=policy),
            "request_deletion": PolicyEvaluator.Result(enabled=False),
        },
        "existing_request": None,
    }
    monkeypatch.setattr(resource_module, "RDMRecordService", type(simple_model_ui_resource.api_service))
    monkeypatch.setattr(resource_module, "evaluate_record_deletion", Mock(return_value=evaluated))
    vocab = Mock()
    vocab.return_value.deletion_request_removal_reasons.return_value = []
    monkeypatch.setattr(resource_module, "VocabulariesOptions", vocab)

    with app.test_request_context():
        g.identity = users[0].identity
        deletion, _ = simple_model_ui_resource._evaluate_record_deletion(_api_record())

    assert deletion["recordDeletion"] == {
        "immediate_deletion": {"enabled": True, "valid_user": True, "allowed": True, "policy": policy},
        "request_deletion": {"enabled": False, "valid_user": False, "allowed": False, "policy": None},
    }


def test_deposit_form_record_deletion_inputs(app):
    ctx = {"record": {"is_published": True}, "files_locked": False, "community_use_jinja_header": False}
    with app.test_request_context():
        html = render_template("oarepo_ui/deposit/form.html", record_deletion={"allowed": True}, **ctx)
    assert 'name="deposits-record-deletion"' in html
    assert 'id="deposits-share-btn-require-link-expiration"' in html

    with app.test_request_context():
        html = render_template("oarepo_ui/deposit/form.html", record_deletion={}, **ctx)
    assert "deposits-record-deletion" not in html
