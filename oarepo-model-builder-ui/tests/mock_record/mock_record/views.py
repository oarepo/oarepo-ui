from flask import Blueprint


def create_blueprint_from_app_mock_record(app):
    """Create  blueprint."""
    if app.config.get("MOCK_RECORD_REGISTER_BLUEPRINT", True):
        blueprint = app.extensions["mock_record"].resource.as_blueprint()
    else:
        blueprint = Blueprint("mock_record", __name__, url_prefix="/empty/mock_record")
    blueprint.record_once(init_create_blueprint_from_app_mock_record)

    # calls record_once for all other functions starting with "init_addons_"
    # https://stackoverflow.com/questions/58785162/how-can-i-call-function-with-string-value-that-equals-to-function-name
    funcs = globals()
    funcs = [
        v
        for k, v in funcs.items()
        if k.startswith("init_addons_mock_record") and callable(v)
    ]
    for func in funcs:
        blueprint.record_once(func)

    return blueprint


def init_create_blueprint_from_app_mock_record(state):
    """Init app."""
    app = state.app
    ext = app.extensions["mock_record"]

    # register service
    sregistry = app.extensions["invenio-records-resources"].registry
    sregistry.register(ext.service, service_id="mock_record")

    # Register indexer
    if hasattr(ext.service, "indexer"):
        iregistry = app.extensions["invenio-indexer"].registry
        iregistry.register(ext.service.indexer, indexer_id="mock_record")
