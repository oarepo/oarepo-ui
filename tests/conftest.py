import shutil
import sys
from pathlib import Path

import pytest
from invenio_access.permissions import system_identity
from invenio_app.factory import create_app as _create_app

from oarepo_ui.resources import RecordsUIResource, RecordsUIResourceConfig
from tests.model import ModelUIResourceConfig, ModelUIResource


@pytest.fixture(scope="module")
def extra_entry_points():
    """Extra entry points to load the mock_module features."""
    return {"invenio_i18n.translations": ["1000-test = tests"]}


@pytest.fixture(scope="module")
def app_config(app_config):
    app_config["I18N_LANGUAGES"] = [("en", "English"), ("cs", "Czech")]
    app_config["BABEL_DEFAULT_LOCALE"] = "en"
    app_config[
        "RECORDS_REFRESOLVER_CLS"
    ] = "invenio_records.resolver.InvenioRefResolver"
    app_config[
        "RECORDS_REFRESOLVER_STORE"
    ] = "invenio_jsonschemas.proxies.current_refresolver_store"

    # for ui tests
    app_config["APP_THEME"] = ["semantic-ui"]
    app_config["THEME_SEARCHBAR"] = False
    app_config[
        "THEME_HEADER_TEMPLATE"
    ] = "oarepo_ui/header.html"

    return app_config


@pytest.fixture(scope="module")
def create_app(instance_path, entry_points):
    """Application factory fixture."""
    return _create_app


@pytest.fixture
def record_service(app):
    pass


@pytest.fixture
def record_ui_resource_config(app):
    return ModelUIResourceConfig()


@pytest.fixture
def record_ui_resource(app, record_ui_resource_config):
    ui_resource = ModelUIResource(record_ui_resource_config)
    app.register_blueprint(ui_resource.as_blueprint(
        template_folder=Path(__file__).parent / 'templates')
    )
    return ui_resource


@pytest.fixture()
def fake_manifest(app):
    python_path = Path(sys.executable)
    invenio_instance_path = python_path.parent.parent / "var" / "instance"
    manifest_path = invenio_instance_path / "static" / "dist"
    manifest_path.mkdir(parents=True, exist_ok=True)
    shutil.copy(
        Path(__file__).parent / "manifest.json", manifest_path / "manifest.json"
    )


@pytest.fixture
def simple_record(app, db, search_clear):
    from .model import ModelRecord, ModelService, ModelServiceConfig
    service = ModelService(ModelServiceConfig())
    sregistry = app.extensions["invenio-records-resources"].registry
    sregistry.register(service, service_id="simple_model")
    record = service.create(
        system_identity,
        {},
    )
    ModelRecord.index.refresh()
    return record
