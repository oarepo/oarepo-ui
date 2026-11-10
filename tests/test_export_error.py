#
# Copyright (c) 2026 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations

from typing import Any, Never

import pytest
from oarepo_runtime.api import ExportEngine
from werkzeug.exceptions import Forbidden, InternalServerError


class UnreadableFilesError(InternalServerError):
    """Like oarepo-formats' error for the files an archive export can not read."""

    files = ("data.csv", "more.txt")


@pytest.mark.parametrize(
    ("error", "status"), [(UnreadableFilesError, 500), (InternalServerError, 500), (Forbidden, 403)]
)
def test_failed_export_page(
    app, location, logged_client, record_with_files_factory, users, extra_entry_points, monkeypatch, error, status
):
    def fail(*args: Any, **kwargs: Any) -> Never:
        raise error

    monkeypatch.setattr(ExportEngine, "export", fail)
    record = record_with_files_factory(users[0].identity)

    with logged_client(users[0]).get(f"/simple-model/records/{record['id']}/export/json") as resp:
        assert resp.status_code == status
        assert ("Export failed" in resp.text) == (status == 500)  # only server errors get the export page
        assert ("<code>data.csv</code>" in resp.text) == (error is UnreadableFilesError)
        if status == 500:
            assert f"/records/{record['id']}" in resp.text  # the link back to the record
