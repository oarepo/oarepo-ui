# SPDX-FileCopyrightText: 2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import TYPE_CHECKING, cast

from flask import g

from oarepo_ui.resources.utils import DISABLED_QUOTA_INCREASE, get_form_files_quota

if TYPE_CHECKING:
    from invenio_records.api import Record

REQUIRED_KEYS = {"maxStorage", "maxFileSize", "quotaIncrease"}


def _fake_record(**attrs) -> Record:
    return cast("Record", SimpleNamespace(**attrs))


def test_quota_new_draft_rdm(app, users, monkeypatch):
    monkeypatch.setitem(app.config, "APP_RDM_DEPOSIT_FORM_QUOTA", {"maxFiles": 7, "maxStorage": 1})
    monkeypatch.setitem(app.config, "RDM_FILES_DEFAULT_QUOTA_SIZE", 5000)
    monkeypatch.setitem(app.config, "RDM_FILES_DEFAULT_MAX_FILE_SIZE", 500)
    monkeypatch.setitem(app.config, "RDM_IMMEDIATE_QUOTA_INCREASE_ENABLED", value=False)
    identity = users[0].identity
    with app.test_request_context():
        g.identity = identity
        quota = get_form_files_quota(None, identity, rdm=True)
    assert set(quota) == {"maxFiles", *REQUIRED_KEYS}
    assert quota["maxFiles"] == 7
    assert quota["maxStorage"] == 5000  # RDM user/default quota overrides APP_RDM_DEPOSIT_FORM_QUOTA
    assert quota["maxFileSize"] == 500
    assert quota["quotaIncrease"]["enabled"] is False
    assert "valid_user" in quota["quotaIncrease"]


def test_quota_new_draft_non_rdm_uses_files_rest_defaults(app, users, monkeypatch):
    # oarepo-config enables immediate quota increase by default; non-RDM models must not get it
    monkeypatch.setitem(app.config, "RDM_IMMEDIATE_QUOTA_INCREASE_ENABLED", value=True)
    monkeypatch.setitem(app.config, "FILES_REST_DEFAULT_QUOTA_SIZE", 3000)
    monkeypatch.setitem(app.config, "FILES_REST_DEFAULT_MAX_FILE_SIZE", 300)
    monkeypatch.setitem(app.config, "RDM_FILES_DEFAULT_QUOTA_SIZE", 5000)
    monkeypatch.setitem(app.config, "RDM_FILES_DEFAULT_MAX_FILE_SIZE", 500)
    identity = users[0].identity
    with app.test_request_context():
        g.identity = identity
        quota = get_form_files_quota(None, identity, rdm=False)
    assert quota["maxStorage"] == 3000  # what invenio-files-rest Bucket.create gives a plain bucket
    assert quota["maxFileSize"] == 300
    assert quota["quotaIncrease"] == DISABLED_QUOTA_INCREASE


def test_quota_non_rdm_defaults_fall_back_to_rdm_config(app, users, monkeypatch):
    monkeypatch.setitem(app.config, "FILES_REST_DEFAULT_QUOTA_SIZE", None)
    monkeypatch.setitem(app.config, "FILES_REST_DEFAULT_MAX_FILE_SIZE", None)
    monkeypatch.setitem(app.config, "RDM_FILES_DEFAULT_QUOTA_SIZE", 5000)
    monkeypatch.setitem(app.config, "RDM_FILES_DEFAULT_MAX_FILE_SIZE", 500)
    with app.test_request_context():
        g.identity = users[0].identity
        quota = get_form_files_quota(None, users[0].identity, rdm=False)
    assert quota["maxStorage"] == 5000  # never None: JS `size > null` would reject every upload
    assert quota["maxFileSize"] == 500


def test_quota_bucket_max_file_size_precedence(app, users, monkeypatch):
    monkeypatch.setitem(app.config, "RDM_FILES_DEFAULT_MAX_FILE_SIZE", 1000)
    record = _fake_record(bucket=SimpleNamespace(quota_size=123, max_file_size=45))
    with app.test_request_context():
        g.identity = users[0].identity
        quota = get_form_files_quota(record, users[0].identity, rdm=False)
    assert quota["maxStorage"] == 123
    assert quota["maxFileSize"] == 45
    assert quota["quotaIncrease"] == DISABLED_QUOTA_INCREASE


def test_quota_bucket_without_max_file_size_falls_back(app, users, monkeypatch):
    monkeypatch.setitem(app.config, "RDM_FILES_DEFAULT_MAX_FILE_SIZE", 1000)
    record = _fake_record(bucket=SimpleNamespace(quota_size=123, max_file_size=None))
    with app.test_request_context():
        g.identity = users[0].identity
        quota = get_form_files_quota(record, users[0].identity, rdm=False)
    assert quota["maxFileSize"] == 1000


def test_quota_non_rdm_bucket_without_quota_size_falls_back(app, users, monkeypatch):
    # plain oarepo-model buckets get FILES_REST_DEFAULT_QUOTA_SIZE, which is None by default
    monkeypatch.setitem(app.config, "FILES_REST_DEFAULT_QUOTA_SIZE", None)
    monkeypatch.setitem(app.config, "RDM_FILES_DEFAULT_QUOTA_SIZE", 5000)
    record = _fake_record(bucket=SimpleNamespace(quota_size=None, max_file_size=45))
    with app.test_request_context():
        g.identity = users[0].identity
        quota = get_form_files_quota(record, users[0].identity, rdm=False)
    assert quota["maxStorage"] == 5000  # never None: JS `size > null` would reject every upload
    assert quota["maxFileSize"] == 45


def test_quota_rdm_bucket_without_limits_uses_rdm_quota(app, users, monkeypatch):
    # oarepo-rdm creates the edit draft of a metadata-only published record with an unlimited bucket;
    # maxStorage must still be a number, otherwise the uploader rejects every file (size > null)
    record = _fake_record(bucket=SimpleNamespace(quota_size=None, max_file_size=None))
    seen = []

    def fake_get_files_quota(rec):
        seen.append(rec)
        return {"quota_size": 777, "max_file_size": 77}

    monkeypatch.setattr("oarepo_ui.resources.utils.get_files_quota", fake_get_files_quota)
    monkeypatch.setattr("oarepo_ui.resources.utils.evaluate_quota_increase", lambda *_a, **_kw: {"enabled": False})
    with app.test_request_context():
        g.identity = users[0].identity
        quota = get_form_files_quota(record, users[0].identity, rdm=True)
    assert seen == [record]
    assert quota["maxStorage"] == 777
    assert quota["maxFileSize"] == 77


def test_quota_rdm_bucket_with_limits_keeps_bucket_values(app, users, monkeypatch):
    record = _fake_record(bucket=SimpleNamespace(quota_size=123, max_file_size=45))

    def fail_get_files_quota(_rec):
        raise AssertionError("bucket limits are authoritative")

    monkeypatch.setattr("oarepo_ui.resources.utils.get_files_quota", fail_get_files_quota)
    monkeypatch.setattr("oarepo_ui.resources.utils.evaluate_quota_increase", lambda *_a, **_kw: {"enabled": False})
    with app.test_request_context():
        g.identity = users[0].identity
        quota = get_form_files_quota(record, users[0].identity, rdm=True)
    assert quota["maxStorage"] == 123
    assert quota["maxFileSize"] == 45


def test_quota_non_rdm_record_without_bucket_does_not_raise(app, users, monkeypatch):
    monkeypatch.setitem(app.config, "FILES_REST_DEFAULT_QUOTA_SIZE", 5000)
    monkeypatch.setitem(app.config, "FILES_REST_DEFAULT_MAX_FILE_SIZE", 500)
    record = _fake_record()  # no bucket, no parent.access -> RDM get_files_quota(record) would raise
    with app.test_request_context():
        g.identity = users[0].identity
        quota = get_form_files_quota(record, users[0].identity, rdm=False)
    assert quota["maxStorage"] == 5000
    assert quota["maxFileSize"] == 500
    assert quota["quotaIncrease"] == DISABLED_QUOTA_INCREASE


def test_deposit_create_quota_shape(app, logged_client, users, extra_entry_points):
    with logged_client(users[0]).get("/simple-model/uploads/new") as resp:
        assert resp.status_code == 200
        quota = json.loads(resp.text)["forms_config"]["quota"]
    assert set(quota) >= REQUIRED_KEYS
    assert "quota_size" not in quota
    assert "max_file_size" not in quota
    assert quota["quotaIncrease"] == DISABLED_QUOTA_INCREASE  # simple_model is not an RDM service


def test_deposit_edit_quota_shape(
    app, location, record_service, logged_client, users, draft_factory, extra_entry_points
):
    draft = draft_factory(users[0].identity)
    with logged_client(users[0]).get(f"/simple-model/uploads/{draft['id']}") as resp:
        assert resp.status_code == 200
        quota = json.loads(resp.text)["forms_config"]["quota"]
    assert set(quota) >= REQUIRED_KEYS
    assert "quota_size" not in quota
    assert quota["maxStorage"] is not None
    assert quota["quotaIncrease"] == DISABLED_QUOTA_INCREASE  # simple_model is not an RDM service
