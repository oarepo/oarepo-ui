from flask import Blueprint
from flask_menu import current_menu
from invenio_base.utils import obj_or_import_string


def create_blueprint(app):
    blueprint = Blueprint(
        "oarepo_ui", __name__, template_folder="templates", static_folder="static"
    )
    blueprint.app_context_processor(lambda: ({"current_app": app}))

    # hide the /admin (maximum recursion depth exceeded menu)
    @blueprint.before_app_first_request
    def init_menu():
        admin_menu = current_menu.submenu("settings.admin")
        admin_menu.hide()

    def add_jinja_filters(state):
        app = state.app
        ext = app.extensions["oarepo_ui"]

        # modified the global env - not pretty, but gets filters to search as well
        env = app.jinja_env
        env.filters.update(
            {
                k: obj_or_import_string(v)
                for k, v in app.config["OAREPO_UI_JINJAX_FILTERS"].items()
            }
        )
        env.globals.update(
            {
                k: obj_or_import_string(v)
                for k, v in app.config["OAREPO_UI_JINJAX_GLOBALS"].items()
            }
        )
        env.policies.setdefault("json.dumps_kwargs", {}).setdefault("default", str)

        # the catalogue should not have been used at this point but if it was, we need to reinitialize it
        ext.reinitialize_catalog()

    blueprint.record_once(add_jinja_filters)

    return blueprint
