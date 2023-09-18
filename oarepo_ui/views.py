from flask import Blueprint

blueprint = Blueprint("oarepo_ui", __name__, template_folder="templates")


def add_jinja_filters(state):
    app = state.app
    ext = app.extensions["oarepo_ui"]

    # TODO: modified the global env - not pretty, but gets filters to search as well
    env = ext.templates.jinja_env
    env.filters.update(ext.app.config["OAREPO_UI_JINJAX_FILTERS"])
    env.policies.setdefault("json.dumps_kwargs", {}).setdefault("default", str)


def set_manifest_loader(state):
    app = state.app
    if app.config["OAREPO_UI_BUILD_FRAMEWORK"] == "vite":
        from oarepo_ui.vite import ViteManifestLoader

        app.config["WEBPACKEXT_MANIFEST_LOADER"] = ViteManifestLoader


blueprint.record_once(add_jinja_filters)
blueprint.record_once(set_manifest_loader)
