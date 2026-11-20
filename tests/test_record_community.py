# SPDX-FileCopyrightText: 2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Tests for community resolution on the record detail and deposit edit pages."""

from __future__ import annotations

import uuid

from flask import g
from invenio_access.permissions import system_identity


def _community_record_ui(cid: str, **expanded_extra) -> dict:
    return {
        "parent": {"communities": {"ids": [cid], "default": cid}, "review": None},
        "expanded": {"parent": {"communities": {"default": {"id": cid, **expanded_extra}}}},
    }


def test_get_record_community_without_communities(app, simple_model_ui_resource, monkeypatch):
    """Records of models without communities never call the community service."""
    calls: list[str] = []
    monkeypatch.setattr(simple_model_ui_resource, "_read_community", calls.append)
    with app.test_request_context():
        g.identity = system_identity
        assert simple_model_ui_resource._get_record_community({"id": "abc"}) == (None, None)
        assert simple_model_ui_resource._get_record_community({"parent": {"review": None, "communities": {}}}) == (
            None,
            None,
        )
        # ghost community (deleted pid) is not read either
        assert simple_model_ui_resource._get_record_community(_community_record_ui("cid", is_ghost=True)) == (
            None,
            "cid",
        )
        assert simple_model_ui_resource._get_draft_community({}) == (None, None, None)
    assert calls == []


def test_missing_community_is_tolerated(app, simple_model_ui_resource):
    """Unknown community ids yield no community instead of an error."""
    missing = str(uuid.uuid4())
    expanded_missing = {"id": missing}
    with app.test_request_context():
        g.identity = system_identity
        assert simple_model_ui_resource._get_record_community(_community_record_ui(missing)) == (None, missing)
        assert simple_model_ui_resource._get_draft_community(
            {"expanded": {"parent": {"communities": {"default": expanded_missing}}}}
        ) == (expanded_missing, None, None)


def test_community_resolution(app, simple_model_ui_resource, community):
    """Default community, review receiver and draft review receiver are resolved."""
    cid = str(community.id)
    with app.test_request_context():
        g.identity = system_identity

        resolved, community_id = simple_model_ui_resource._get_record_community(_community_record_ui(cid))
        assert community_id == cid
        assert resolved is not None
        assert resolved["slug"] == community.slug

        resolved, community_id = simple_model_ui_resource._get_record_community(
            {"parent": {"review": {"receiver": {"community": cid}}}}
        )
        assert community_id == cid
        assert resolved is not None
        assert resolved["slug"] == community.slug

        resolved, community_ui, theme = simple_model_ui_resource._get_draft_community(
            {"expanded": {"review": {"receiver": {"id": cid}}}}
        )
        assert resolved["slug"] == community.slug
        assert community_ui is not None
        assert community_ui["slug"] == community.slug
        assert not theme
