import os

from flask import current_app
from flask_webpackext import WebpackBundleProject
from pywebpack import bundles_from_entry_point
from pywebpack.helpers import cached

from .proxies import current_ui_overrides

overrides_js_template = """
import { overrideStore, parametrize } from 'react-overridable';

{% for key, component in overrides.items() -%}
{{ component.import_statement | safe }}
{% endfor %}

{%- for key, component in overrides.items() -%}
{%- if component.props -%}{{ component.parametrize_statement | safe }}{%- endif -%}
{%- endfor %}

{% for key, component in overrides.items() -%}
overrideStore.add('{{ key }}', {{ component.name }});
{% endfor %}
"""


class OverridableBundleProject(WebpackBundleProject):
    def __init__(
        self,
        import_name,
        project_folder=None,
        bundles=None,
        config=None,
        config_path=None,
        overrides_bundle_path="_overrides",
    ):
        """Initialize templated folder.

        :param import_name: Name of the module where the WebpackBundleProject
            class is instantiated. It is used to determine the absolute path
            to the ``project_folder``.
        :param project_folder: Relative path to the Webpack project which is
            going to aggregate all the ``bundles``.
        :param bundles: List of
            :class:`flask_webpackext.bundle.WebpackBundle`. This list can be
            statically defined if the bundles are known before hand, or
            dinamically generated using
            :func:`pywebpack.helpers.bundles_from_entry_point` so the bundles
            are discovered from the defined Webpack entrypoints exposed by
            other modules.
        :param config: Dictionary which overrides the ``config.json`` file
            generated by Flask-WebpackExt. Use carefuly and only if you know
            what you are doing since ``config.json`` is the file that holds the
            key information to integrate Flask with Webpack.
        :param config_path: Path where Flask-WebpackExt is going to write the
            ``config.json``, this file is generated by
            :func:`flask_webpackext.project.flask_config`.
        :param overrides_bundle_path: Path where special bundle for UI overrides
            if going to be generated.
        """
        # Following is needed to correctly resolve paths to etc. source package.json from invenio_assets
        _import_name = "invenio_assets.webpack"
        super(OverridableBundleProject, self).__init__(
            _import_name,
            project_folder=project_folder,
            bundles=bundles,
            config=config,
            config_path=config_path,
        )
        self._overrides_bundle_path = overrides_bundle_path
        self._generated_paths = []

    @property
    def overrides_bundle_asset_path(self):
        return f"js/{self._overrides_bundle_path}"

    @property
    def overrides_bundle_path(self):
        return os.path.join(self.project_path, self.overrides_bundle_asset_path)

    @property
    def generated_paths(self):
        # Mark everything under overrides_bundle_path as generated & managed by this bundle project
        return [self.overrides_bundle_path]

    @property
    @cached
    def entry(self):
        """Get webpack entry points."""
        bundle_entries = super().entry
        for bp_name, overrides in current_ui_overrides.items():
            bundle_entries[f"overrides-{bp_name}"] = (
                f"./{self.overrides_bundle_asset_path}/{bp_name}.js"
            )
        return bundle_entries

    def create(self, force=None):
        """Create webpack project from a template.

        This command collects all asset files from the bundles.
        It generates a new package.json by merging the package.json
        dependencies of each bundle. Additionally, it generates a special
        bundle for any UI overrides.
        """
        super().create(force)

        # Generate special bundle for configured UI overrides
        if not os.path.exists(self.overrides_bundle_path):
            os.mkdir(self.overrides_bundle_path)

        for bp_name, overrides in current_ui_overrides.items():
            template = current_app.jinja_env.from_string(overrides_js_template)
            overrides_js_content = template.render({"overrides": overrides})
            overrides_js_path = os.path.join(
                self.overrides_bundle_path, f"{bp_name}.js"
            )

            with open(overrides_js_path, "w+") as f:
                f.write(overrides_js_content)

    def clean(self):
        """Clean created webpack project."""
        super().clean()
        self.generated_paths.clear()


project = OverridableBundleProject(
    __name__,
    project_folder="assets",
    config_path="build/config.json",
    bundles=bundles_from_entry_point("invenio_assets.webpack"),
)
