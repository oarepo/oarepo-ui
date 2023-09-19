# parts taken from https://github.com/abilian/flask-vite/
from pathlib import Path

from flask import current_app
from flask_webpackext.errors import ManifestKeyNotFoundError
from flask_webpackext.manifest import JinjaManifest
from invenio_assets.webpack import UniqueJinjaManifestLoader, UniqueJinjaManifestEntry
from pywebpack.manifests import ManifestFactory
from .proxies import current_oarepo_ui


def add_vite_tags(response):
    if response.status_code != 200:
        return response

    mimetype = response.mimetype or ""
    if not mimetype.startswith("text/html"):
        return response

    if not isinstance(response.response, list):
        return response

    body = b"".join(response.response).decode()
    tag = make_tag()
    body = body.replace("<head>", f"<head>\n{tag}\n")
    response.response = [body.encode("utf8")]
    response.content_length = len(response.response[0])
    return response


def make_tag():
    return (
        """         
<!-- REACT_VITE_HEADER INSTRUMENTATION-->
<script type="module">
  import RefreshRuntime from 'https://127.0.0.1:5173/@react-refresh'
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
</script>

<!-- FLASK_VITE_HEADER INSTRUMENTATION -->
<script type="module" src="https://127.0.0.1:5173/@vite/client"></script>
<!-- END OF VITE INSTRUMENTATION -->
        """
    ).strip()


class ViteFactory(ManifestFactory):
    def load(self, filepath):
        if Path(filepath).exists():
            return super().load(filepath)
        return self.create({})

    def create(self, data):
        """Create manifest from parsed data."""
        manifest = self.create_manifest()
        # TODO: load items from vite manifest
        collected_entrypoints = {}
        for ep_name, ep_value in data.items():
            if ep_name.startswith("entrypoints/"):
                ep_name = ep_name[len("entrypoints/") :]
                if ep_name.endswith(".html"):
                    ep_name = ep_name[:-5]
                elif ep_name.endswith(".css"):
                    ep_name = ep_name[:-4]
                collected = []
                self.collect_deps(data, ep_value, collected, set())
                collected_entrypoints.setdefault(ep_name, []).extend(collected)
        for k, v in collected_entrypoints.items():
            manifest.add(self.create_entry(k, v))
        return manifest

    def collect_deps(self, data, ep_value, collected, processed):
        for imp in ep_value.get("imports", []):
            if imp not in processed:
                processed.add(imp)
                self.collect_deps(data, data[imp], collected, processed)
        if "file" in ep_value:
            collected.append(ep_value["file"])
        return collected


class PassThroughManifest(JinjaManifest):
    def __getitem__(self, item):
        print(f"Getting manifest {item=}")
        try:
            return super().__getitem__(item)
        except ManifestKeyNotFoundError:
            if not current_app.config.get("OAREPO_UI_DEVELOPMENT_MODE"):
                raise
            if item.endswith('.css'):
                # TODO: in development, handle css better way than via .js
                return ViteManifestEntry(
                    name=item[:-4],
                    paths=[
                        f"{current_oarepo_ui.vite_server_url}entrypoints/{item[:-4]}.js",
                    ],
                )
            elif item.endswith('.js'):
                return ViteManifestEntry(
                    name=item[:-3],
                    paths=[
                        f"{current_oarepo_ui.vite_server_url}entrypoints/{item[:-3]}.js",
                    ],
                )


class ViteManifestEntry(UniqueJinjaManifestEntry):
    templates = {
        '.js': '<script type="module" src="{}"></script>',
        '.css': '<link rel="stylesheet" href="{}" />',
    }


# TODO: images, fonts and other assets
class ViteManifestLoader(UniqueJinjaManifestLoader):
    """Factory which uses the Jinja manifest entry."""

    types = [ViteFactory]

    def __init__(
        self, manifest_cls=PassThroughManifest, entry_cls=ViteManifestEntry
    ):
        """Initialize manifest loader."""
        super(UniqueJinjaManifestLoader, self).__init__(
            manifest_cls=manifest_cls, entry_cls=entry_cls
        )

    def load(self, filepath):
        """Load a manifest from a file."""
        if current_app.debug or filepath not in ViteManifestLoader.cache:
            ViteManifestLoader.cache[filepath] = super(ViteManifestLoader, self).load(
                filepath
            )
        return ViteManifestLoader.cache[filepath]
