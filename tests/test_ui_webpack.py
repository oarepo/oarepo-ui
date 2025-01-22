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
        assert proj.overrides_bundle_path == os.path.join(proj.project_path, 'js/_overrides')
        assert os.path.exists(proj.package_json_source_path)


def test_overridable_bundle_project_entry(app):
    app.config['UI_OVERRIDES'] = {
        'test_bp': {'componentA': ['ComponentA', 'components/ComponentA']}
    }
    with app.app_context():
        entry_points = project.entry
        assert 'overrides-test_bp' in entry_points
        assert entry_points['overrides-test_bp'] == './js/_overrides/test_bp.js'


def test_overridable_bundle_project_entry_file(app, fake_manifest):
    app.config['UI_OVERRIDES'] = {
        'test_bp': {'componentA.item': ['ComponentA', 'components/ComponentA']}
    }
    with app.app_context():
        project.create()
        assert os.path.exists(project.package_json_source_path)

        assert os.path.isdir(project.overrides_bundle_path)

        overrides_file_path = os.path.join(project.overrides_bundle_path, 'test_bp.js')
        assert os.path.exists(overrides_file_path)
        with open(overrides_file_path) as f:
            overrides_file_path_content = f.read()
            assert overrides_file_path_content == '''
import { overrideStore } from 'react-overridable';

import ComponentA from 'components/ComponentA';

overrideStore.add('componentA.item', ComponentA);'''


def test_overridable_bundle_project_generated_paths(app, fake_manifest):
    app.config['UI_OVERRIDES'] = {
        'test_bp1': {'componentA.item': ['ComponentA', 'components/ComponentA']},
        'test_bp2': {'componentA.item': ['ComponentB', 'components/ComponentB']}
    }

    project.clean()
    project.create()

    assert len(project.generated_paths) == 3
    assert all([
        os.path.join(project.overrides_bundle_path, path) in project.generated_paths
        for path in ['test_bp1.js', 'test_bp2.js', '']
    ])

