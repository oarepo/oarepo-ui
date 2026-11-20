# SPDX-FileCopyrightText: 2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

import pytest
from werkzeug.datastructures import MultiDict


class _StopDetailError(Exception):
    """Raised by a patched hook to stop ``_detail`` right after the preview_file handling."""


def test_record_detail_args_preview_file(simple_model_ui_resource_config):
    schema = simple_model_ui_resource_config.request_record_detail_args()
    loaded = schema.load(MultiDict({"preview_file": "shiba.png"}))
    assert loaded["preview_file"] == "shiba.png"
    # absent arg -> no kwarg is passed and the ``_detail`` default (None) applies
    assert "preview_file" not in schema.load(MultiDict({}))


def _run_detail_until_avatar(resource, monkeypatch, record_ui: dict[str, Any], **kwargs: Any) -> None:
    def stop() -> None:
        raise _StopDetailError

    monkeypatch.setattr(resource, "_prepare_files", lambda _files, _media: (None, None))
    monkeypatch.setattr(resource, "_prepare_record_ui", lambda _record: record_ui)
    monkeypatch.setattr(resource, "_get_user_avatar", stop)
    with pytest.raises(_StopDetailError):
        resource._detail(SimpleNamespace(), None, None, **kwargs)


def test_detail_preview_file_sets_default_preview(app, simple_model_ui_resource, monkeypatch):
    record_ui: dict[str, Any] = {"files": {"enabled": True, "default_preview": None}}
    _run_detail_until_avatar(simple_model_ui_resource, monkeypatch, record_ui, preview_file="shiba.png")
    assert record_ui["files"]["default_preview"] == "shiba.png"


def test_detail_without_preview_file_keeps_default_preview(app, simple_model_ui_resource, monkeypatch):
    record_ui: dict[str, Any] = {"files": {"enabled": True, "default_preview": "orig.pdf"}}
    _run_detail_until_avatar(simple_model_ui_resource, monkeypatch, record_ui)
    assert record_ui["files"]["default_preview"] == "orig.pdf"
    _run_detail_until_avatar(simple_model_ui_resource, monkeypatch, record_ui, preview_file="")
    assert record_ui["files"]["default_preview"] == "orig.pdf"


def test_detail_preview_file_ignored_without_files(app, simple_model_ui_resource, monkeypatch):
    # e.g. no ui_serializer / model without files: must not raise KeyError (upstream would)
    record_ui: dict[str, Any] = {}
    _run_detail_until_avatar(simple_model_ui_resource, monkeypatch, record_ui, preview_file="shiba.png")
    assert "files" not in record_ui
