from flask import Blueprint

blueprint = Blueprint("oarepo_ui", __name__, template_folder="templates")


def add_jinja_filters(state):
    app = state.app
    ext = app.extensions["oarepo_ui"]

    # TODO: modified the global env - not pretty, but gets filters to search as well
    env = ext.templates.jinja_env
    env.filters.update(ext.app.config["OAREPO_UI_JINJAX_FILTERS"])


blueprint.record_once(add_jinja_filters)
