#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations

from pathlib import Path

import pytest

from oarepo_ui.ui.components import UIComponent, UIComponentImportMode, UIComponentOverride
from oarepo_ui.webpack import OverridableBundleProject, project


def test_overridable_bundle_project_init(app):
    proj = OverridableBundleProject(
        import_name="test_app",
        project_folder="assets",
        config_path="test_build/config.json",
        bundles=[],
    )
    with app.app_context():
        assert proj._project_template_dir.endswith(  # noqa: SLF001 private access
            "invenio_assets/assets"
        )
        assert proj.config_path.endswith("test_build/config.json")
        assert Path(proj.overrides_bundle_path) == Path(proj.project_path) / "js" / "_overrides"
        assert Path(proj.package_json_source_path).exists()


def test_overridable_bundle_project_entry(app):
    assert app.extensions["oarepo_ui"].ui_overrides is not None
    del app.extensions["oarepo_ui"].ui_overrides

    app.config["OAREPO_UI_OVERRIDES"] = {
        UIComponentOverride("test_bp", "componentA", UIComponent("ComponentA", "components/ComponentA"))
    }
    with app.app_context():
        entry_points = project.entry
        assert "overrides-test_bp" in entry_points
        assert entry_points["overrides-test_bp"] == "./js/_overrides/test_bp.js"


def test_overridable_bundle_project_entry_file(app):
    assert app.extensions["oarepo_ui"].ui_overrides is not None
    del app.extensions["oarepo_ui"].ui_overrides

    app.config["OAREPO_UI_OVERRIDES"] = {
        UIComponentOverride("test_bp", "componentA.item", UIComponent("ComponentA", "components/ComponentA")),
        UIComponentOverride(
            "test_bp",
            "componentB.item",
            UIComponent("DefaultComponent", "components/DefaultComponent", UIComponentImportMode.DEFAULT),
        ),
    }
    with app.app_context():
        project.create()
        assert Path(project.package_json_source_path).exists()

        assert Path(project.overrides_bundle_path).is_dir()

        overrides_file_path = Path(project.overrides_bundle_path) / "test_bp.js"
        assert overrides_file_path.exists()

        expected= """
import { overrideStore, parametrize } from 'react-overridable';

import { ComponentA } from 'components/ComponentA';
import DefaultComponent from 'components/DefaultComponent';


overrideStore.add('componentA.item', ComponentA);
overrideStore.add('componentB.item', DefaultComponent);
"""

        with overrides_file_path.open() as f:
            overrides_file_path_content = f.read()
            assert set(overrides_file_path_content.splitlines()) == set(expected.splitlines())


def test_overridable_bundle_project_generated_paths(app):
    app.config["OAREPO_UI_OVERRIDES"] = {
        UIComponentOverride("test_bp1", "componentA.item", UIComponent("ComponentA", "components/ComponentA")),
        UIComponentOverride("test_bp2", "componentA.item", UIComponent("ComponentB", "components/ComponentB")),
    }

    project.clean()
    project.create()

    assert len(project.generated_paths) == 1
    assert project.overrides_bundle_path in project.generated_paths


# @pytest.mark.skip("Not yet ported to rspack and typed ui overrides")
def test_overridable_result_item_registration(app):
    pass
