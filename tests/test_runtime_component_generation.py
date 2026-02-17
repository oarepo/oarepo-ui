#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Tests for runtime JinjaX component generation."""

from __future__ import annotations

from typing import TYPE_CHECKING

from oarepo_ui.proxies import current_oarepo_ui
from oarepo_ui.resources.records.config import RecordsUIResourceConfig
from oarepo_ui.resources.records.resource import RecordsUIResource

if TYPE_CHECKING:
    from collections.abc import Mapping


def _create_test_resource(clear_generated: bool = False) -> RecordsUIResource:
    """Create a test resource with empty templates config.

    :param clear_generated: If True, clear the _generated_components cache.
    :return: Configured test resource instance.
    """
    del current_oarepo_ui.catalog.component_paths
    if clear_generated:
        current_oarepo_ui.catalog._generated_components.clear()  # noqa: SLF001

    class TestConfig(RecordsUIResourceConfig):
        model_name = "test_model"
        blueprint_name = "test_records"
        url_prefix = "/test"
        templates: Mapping[str, str | None] = {}

    class TestResource(RecordsUIResource):
        pass

    return TestResource(TestConfig())


def test_runtime_component_generation(app):
    """Test that runtime component is generated when template not configured."""
    resource = _create_test_resource()

    # Create render_kwargs similar to what _detail would create
    render_kwargs = {
        "record": None,
        "record_ui": {},
        "files": None,
        "media_files": None,
        "permissions": {},
        "is_preview": False,
        "include_deleted": False,
        "is_draft": False,
        "model": None,
        "model_name": "test_model",
        "community": None,
        "community_ui": None,
        "user_avatar": None,
        "record_owner_id": None,
        "ui_links": {},
        "extra_context": {},
        "d": None,
    }

    # Get the component name - this should trigger runtime generation
    component_name = resource.get_jinjax_macro(
        "record_detail",
        render_kwargs=render_kwargs,
    )

    # Verify component name follows the pattern
    assert component_name == "test_model.record_detail"

    # Verify the component was registered in the catalog
    assert hasattr(current_oarepo_ui.catalog, "_generated_components")
    assert component_name in current_oarepo_ui.catalog._generated_components  # noqa: SLF001

    # Verify the generated source contains {# def ... #} block
    source = current_oarepo_ui.catalog._generated_components[component_name]  # noqa: SLF001
    assert "{# def" in source

    # Verify all props from render_kwargs are declared
    for prop in render_kwargs:
        assert prop in source

    # Verify extends statement
    assert '{% extends "test_model/record_detail.html" %}' in source


def test_runtime_component_generation_for_search(app):
    """Test that runtime component is generated for search view."""
    resource = _create_test_resource()

    render_kwargs = {
        "search_options": {},
        "search_app_config": {},
        "extra_context": {},
        "context": {},
        "d": None,
    }

    component_name = resource.get_jinjax_macro(
        "search",
        render_kwargs=render_kwargs,
    )

    assert component_name == "test_model.search"

    source = current_oarepo_ui.catalog._generated_components[component_name]  # noqa: SLF001
    assert '{% extends "test_model/record_search.html" %}' in source


def test_runtime_component_generation_for_deposit_edit(app):
    """Test that runtime component is generated for deposit_edit view."""
    resource = _create_test_resource()

    render_kwargs = {
        "forms_config": {},
        "record": {},
        "theme": None,
        "community": None,
        "community_ui": {},
        "community_use_jinja_header": False,
        "files": None,
        "searchbar_config": {},
        "files_locked": True,
        "permissions": {},
        "extra_context": {},
        "ui_links": {},
        "webpack_entry": "test_model_deposit_form.js",
        "context": {},
        "d": None,
    }

    component_name = resource.get_jinjax_macro(
        "deposit_edit",
        render_kwargs=render_kwargs,
    )

    assert component_name == "test_model.deposit_edit"

    source = current_oarepo_ui.catalog._generated_components[component_name]  # noqa: SLF001
    assert '{% extends "test_model/deposit_edit.html" %}' in source


def test_runtime_component_generation_for_deposit_create(app):
    """Test that runtime component is generated for deposit_create view."""
    resource = _create_test_resource()

    render_kwargs = {
        "theme": None,
        "forms_config": {},
        "searchbar_config": {},
        "record": {},
        "community": None,
        "community_ui": None,
        "community_use_jinja_header": False,
        "files": {},
        "preselectedCommunity": None,
        "files_locked": False,
        "extra_context": {},
        "ui_links": {},
        "webpack_entry": "test_model_deposit_form.js",
        "context": {},
        "permissions": {},
    }

    component_name = resource.get_jinjax_macro(
        "deposit_create",
        render_kwargs=render_kwargs,
    )

    assert component_name == "test_model.deposit_create"

    source = current_oarepo_ui.catalog._generated_components[component_name]  # noqa: SLF001
    assert '{% extends "test_model/deposit_create.html" %}' in source


def test_runtime_component_caching(app):
    """Test that runtime components are cached."""
    resource = _create_test_resource(clear_generated=True)

    render_kwargs = {
        "record": None,
        "record_ui": {},
        "files": None,
        "media_files": None,
        "permissions": {},
        "is_preview": False,
        "include_deleted": False,
        "is_draft": False,
        "model": None,
        "model_name": "test_model",
        "community": None,
        "community_ui": None,
        "user_avatar": None,
        "record_owner_id": None,
        "ui_links": {},
        "extra_context": {},
        "d": None,
    }

    # First call - should generate
    component_name_1 = resource.get_jinjax_macro(
        "record_detail",
        render_kwargs=render_kwargs,
    )

    # Second call - should return cached
    component_name_2 = resource.get_jinjax_macro(
        "record_detail",
        render_kwargs=render_kwargs,
    )

    assert component_name_1 == component_name_2

    # Verify only one entry in generated components
    assert len(current_oarepo_ui.catalog._generated_components) == 1  # noqa: SLF001
