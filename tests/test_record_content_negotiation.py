# SPDX-FileCopyrightText: 2026 CESNET z.s.p.o.
# SPDX-License-Identifier: MIT
"""Exercise the registered record-detail route, including its outer decorators."""

from urllib.parse import urlsplit

import pytest

DATACITE = "application/vnd.datacite.datacite+json"


@pytest.mark.parametrize(
    ("accept", "status"),
    [
        (None, 200),
        ("*/*", 200),
        (DATACITE, 302),
        (f"text/html;q=0.1, {DATACITE}", 302),
        (f"text/html, {DATACITE};q=0.1", 200),
        ("application/xml, text/html;q=0.5", 200),
        ("application/xml", 406),
        ("*/*;q=0", 406),
    ],
)
def test_landing_page_negotiation(logged_client, users, record_factory, extra_entry_points, accept, status):
    creator = users[0]
    record = record_factory(creator.identity)
    client = logged_client(creator)
    headers = {"Accept": accept} if accept is not None else {}
    response = client.get(urlsplit(record["links"]["self_html"]).path, headers=headers)
    assert response.status_code == status
    assert "Accept" in response.vary
    if status == 302:
        assert response.location == record["links"]["self"]
    elif status == 200:
        assert response.mimetype == "text/html"
    else:
        assert DATACITE in response.get_json()["message"]


def test_negotiated_draft_redirect(logged_client, users, draft_factory, extra_entry_points):
    creator = users[0]
    draft = draft_factory(creator.identity)
    url = urlsplit(draft["links"]["preview_html"])
    response = logged_client(creator).head(url.path + "?" + url.query, headers={"Accept": DATACITE})
    assert response.status_code == 302
    assert response.location == draft["links"]["self"]
    assert "Accept" in response.vary
