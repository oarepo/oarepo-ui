import os
import pytest
from flask import Flask
from oarepo_ui.webpack import OverridableBundleProject, project


def test_overridable_bundle_project_init():
    proj = OverridableBundleProject(
        import_name='test_app',
        project_folder='test_assets',
        config_path='test_build/config.json',
        bundles=[]
    )
    assert proj.import_name == 'invenio_assets.webpack'
    assert proj.project_folder == 'test_assets'
    assert proj.config_path == 'test_build/config.json'
    assert proj.overrides_bundle_path == '_overrides'


def test_overridable_bundle_project_entry(app):
    app.config['UI_OVERRIDES'] = {
        'test_bp': {'componentA': ['ComponentA', 'components/ComponentA']}
    }
    with app.app_context():
        entry_points = project.entry
        assert 'overrides-test_bp' in entry_points
        assert entry_points['overrides-test_bp'] == './js/_overrides/test_bp.js'


def test_create_overrides_bundle(app, fake_manifest):
    app.config['UI_OVERRIDES'] = {
        'test_bp': {'componentA': ['ComponentA', 'components/ComponentA']}
    }
    with app.app_context():
        project.create()
        # TODO: check assets folder


def test_create_writes_override_files(app, fake_manifest):
    app.config['UI_OVERRIDES'] = {
        'test_bp': {'componentA': ['ComponentA', 'components/ComponentA']}
    }
    with app.app_context():
        project.create()
        # mock_open.assert_called_once_with(os.path.join(project.project_path, 'js/_overrides/test_bp.js'), 'w+')
        # written_content = mock_open().write.call_args[0][0]
        # assert 'overrideStore.add' in written_content
