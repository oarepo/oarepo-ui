# SPDX-FileCopyrightText: 2025-2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Unit tests for FilesLockedComponent.

These exercise the branches of ``before_ui_edit`` directly, without spinning up
the full edit endpoint. In particular they cover the bucket-lock branch, which
is otherwise only reachable through the file-modification grace-period request
flow (not available to the test service here).
"""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from invenio_records_resources.services.records.results import RecordItem

from oarepo_ui.resources.base import UIComponentsResource
from oarepo_ui.resources.components import FilesLockedComponent


def _api_record(*, bucket_locked: bool) -> RecordItem:
    """Build a minimal RecordItem stand-in with a draft bucket.

    ``record_from_result`` returns ``api_record._record``, and the component
    reads ``draft.files.bucket.locked`` off of that.
    """
    bucket = SimpleNamespace(locked=bucket_locked)
    draft = SimpleNamespace(files=SimpleNamespace(bucket=bucket))
    return Mock(spec=RecordItem, _record=draft)


@pytest.fixture
def component() -> FilesLockedComponent:
    # The component under test does not use its resource; a spec'd mock keeps the
    # constructor contract and fails loudly if that ever changes.
    return FilesLockedComponent(resource=Mock(spec=UIComponentsResource))


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
