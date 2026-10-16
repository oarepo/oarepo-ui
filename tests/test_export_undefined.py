# SPDX-FileCopyrightText: 2025 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

from __future__ import annotations


def test_nonexistent_format(app, location, logged_client, record_with_files_factory, users, extra_entry_points):
    record = record_with_files_factory(users[0].identity)
    with logged_client(users[0]).get(f"/simple-model/records/{record['id']}/export/blahblah") as c:
        assert c.status_code == 404
