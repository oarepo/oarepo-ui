import os
from oarepo_ui.webpack import OverridableBundleProject, project


def test_overridable_bundle_project_init(app):
    proj = OverridableBundleProject(
        import_name='test_app',
        project_folder='assets',
        config_path='test_build/config.json',
        bundles=[]
    )
    with app.app_context():
        assert proj._project_template_dir.endswith('invenio_assets/assets')
        assert proj.config_path.endswith('test_build/config.json')
        assert proj.overrides_bundle_path == '_overrides'
        assert os.path.exists(proj.package_json_source_path)

def test_overridable_project_entry(app):
    app.config['UI_OVERRIDES'] = {
        'test_bp': {'componentA': ['ComponentA', 'components/ComponentA']}
    }
    with app.app_context():
        entry_points = project.entry
        assert 'overrides-test_bp' in entry_points
        assert entry_points['overrides-test_bp'] == './js/_overrides/test_bp.js'


def test_overridable_project_entry_file(app, fake_manifest):
    app.config['UI_OVERRIDES'] = {
        'test_bp': {'componentA.item': ['ComponentA', 'components/ComponentA']}
    }
    with app.app_context():
        project.create()
        assert os.path.exists(project.package_json_source_path)

        overrides_bundle_dir = os.path.join(project.project_path,  f'js/{project.overrides_bundle_path}')
        assert os.path.isdir(overrides_bundle_dir)

        overrides_file_path = os.path.join(overrides_bundle_dir, 'test_bp.js')
        assert os.path.exists(overrides_file_path)
        with open(overrides_file_path) as f:
            overrides_file_path_content = f.read()
            assert overrides_file_path_content == '''
import { overrideStore } from 'react-overridable';

import ComponentA from 'components/ComponentA';

overrideStore.add('componentA.item', ComponentA);'''
