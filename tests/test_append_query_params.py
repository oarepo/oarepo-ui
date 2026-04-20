#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Tests for append_query_params utility function."""

from __future__ import annotations

from oarepo_ui.utils import append_query_params


def test_append_query_params_no_params():
    assert append_query_params("https://example.com/record/1", {}) == "https://example.com/record/1"


def test_append_query_params_no_existing_query():
    result = append_query_params("https://example.com/record/1", {"foo": "bar", "baz": "qux"})
    assert result == "https://example.com/record/1?foo=bar&baz=qux"


def test_append_query_params_merges_with_existing_query():
    result = append_query_params("https://example.com/record/1?existing=2", {"incoming": "1"})
    assert "existing=2" in result
    assert "incoming=1" in result


def test_append_query_params_incoming_overrides_existing():
    result = append_query_params("https://example.com/record/1?key=old", {"key": "new"})
    assert "key=new" in result
    assert "key=old" not in result


def test_append_query_params_preserves_duplicate_keys():
    result = append_query_params("https://example.com/search?f=type:article&f=lang:en", {"embed": "true"})
    assert result.count("f=") == 2
    assert "f=type%3Aarticle" in result
    assert "f=lang%3Aen" in result
    assert "embed=true" in result
