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
    body = body.replace("</head>", f"{tag}\n</head>")
    response.response = [body.encode("utf8")]
    response.content_length = len(response.response[0])
    return response


def make_tag():
    vite_server = current_app.config['OAREPO_VITE_SERVER_URL']
    if not vite_server.endswith('/'):
        vite_server += '/'
    return (
        f"""         
            <!-- REACT_VITE_HEADER -->
            <script type="module">
              import RefreshRuntime from "{vite_server}@react-refresh"
              RefreshRuntime.injectIntoGlobalHook(window)
              window.$RefreshReg$ = () => {'{}'}
              window.$RefreshSig$ = () => (type) => type
              window.__vite_plugin_react_preamble_installed__ = true
            </script>
            
            <!-- FLASK_VITE_HEADER -->
            <script type="module" src="{vite_server}@vite/client"></script>
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
        try:
            return super().__getitem__(item)
        except ManifestKeyNotFoundError:
            if not current_app.config.get("OAREPO_UI_DEVELOPMENT_MODE"):
                raise
            if item.endswith('.css'):
                item = item[:-4] + '.js'
            return ViteManifestEntry(
                name=item,
                paths=[
                    f"{current_oarepo_ui.vite_server_url}.vite/{item}",
                    # vite generates only javascripts, not importable styles
                    # f"{current_oarepo_ui.vite_server_url}.vite/{item}.css",
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
