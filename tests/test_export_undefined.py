#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations


def test_nonexistent_format(app, location, logged_client, record_with_files_factory, users, extra_entry_points):
    record = record_with_files_factory(users[0].identity)
    with logged_client(users[0]).get(f"/simple-model/records/{record['id']}/export/blahblah") as c:
        assert c.status_code == 404
