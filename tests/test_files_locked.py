#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Unit tests for FilesLockedComponent.

These exercise the branches of ``before_ui_edit`` directly, without spinning up
the full edit endpoint. In particular they cover the bucket-lock branch, which
is otherwise only reachable through the file-modification grace-period request
flow (not available to the test service here).
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from oarepo_ui.resources.components import FilesLockedComponent


def _api_record(*, bucket_locked: bool) -> SimpleNamespace:
    """Build a minimal RecordItem-like object with a draft bucket.

    ``record_from_result`` returns ``api_record._record``, and the component
    reads ``draft.files.bucket.locked`` off of that.
    """
    bucket = SimpleNamespace(locked=bucket_locked)
    draft = SimpleNamespace(files=SimpleNamespace(bucket=bucket))
    return SimpleNamespace(_record=draft)


@pytest.fixture
def component() -> FilesLockedComponent:
    # before_ui_edit never touches self.resource, so a None resource is fine.
    return FilesLockedComponent(resource=None)  # type: ignore[arg-type]


def test_files_unlocked_when_bucket_unlocked(component: FilesLockedComponent) -> None:
    render_kwargs: dict = {}
    component.before_ui_edit(
        api_record=_api_record(bucket_locked=False),
        render_kwargs=render_kwargs,
    )
    assert render_kwargs["files_locked"] is False


def test_files_locked_when_bucket_locked(component: FilesLockedComponent) -> None:
    render_kwargs: dict = {}
    component.before_ui_edit(
        api_record=_api_record(bucket_locked=True),
        render_kwargs=render_kwargs,
    )
    assert render_kwargs["files_locked"] is True


def test_before_ui_create_always_unlocked(component: FilesLockedComponent) -> None:
    render_kwargs: dict = {}
    component.before_ui_create(render_kwargs=render_kwargs)
    assert render_kwargs["files_locked"] is False
