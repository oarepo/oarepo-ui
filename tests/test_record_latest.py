#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#

def test_record_latest_redirect(app, location, logged_client, users, record_factory, extra_entry_points):
    record = record_factory(users[0].identity)
    assert "latest_html" in record["links"]
    url = record["links"]["latest_html"].split("/", 3)[-1]
    with logged_client(users[0]).get(f"/{url}") as resp:
        assert resp.status_code == 302
        assert resp.location == record["links"]["self_html"]
