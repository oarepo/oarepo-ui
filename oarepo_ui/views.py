from flask import Blueprint
from invenio_base.utils import obj_or_import_string

blueprint = Blueprint("oarepo_ui", __name__, template_folder="templates")


def add_jinja_filters(state):
    app = state.app
    ext = app.extensions["oarepo_ui"]

    # modified the global env - not pretty, but gets filters to search as well
    env = app.jinja_env
    env.filters.update({k: obj_or_import_string(v) for k, v in app.config["OAREPO_UI_JINJAX_FILTERS"].items()})
    env.globals.update({k: obj_or_import_string(v) for k, v in app.config["OAREPO_UI_JINJAX_GLOBALS"].items()})
    env.policies.setdefault("json.dumps_kwargs", {}).setdefault("default", str)

    # the catalogue should not have been used at this point but if it was, we need to reinitialize it
    ext.reinitialize_catalog()


blueprint.record_once(add_jinja_filters)
