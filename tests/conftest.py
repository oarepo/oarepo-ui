import shutil
import sys
from pathlib import Path

import pytest
from flask_security import login_user
from flask_security.utils import hash_password
from invenio_access import ActionUsers, current_access
from invenio_access.models import ActionRoles
from invenio_access.permissions import superuser_access, system_identity
from invenio_accounts.models import Role
from invenio_accounts.testutils import login_user_via_session
from invenio_app.factory import create_app as _create_app

from tests.model import (
    ModelUIResource,
    ModelUIResourceConfig,
    TitlePageUIResource,
    TitlePageUIResourceConfig,
)


@pytest.fixture(scope="module")
def extra_entry_points():
    """Extra entry points to load the mock_module features."""
    return {
        "invenio_i18n.translations": ["1000-test = tests"],
        "oarepo.ui": ["simple_model = tests:simple_model.json"],
    }


@pytest.fixture(scope="module")
def app_config(app_config):
    app_config["I18N_LANGUAGES"] = [("cs", "Czech")]
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
    app_config["THEME_HEADER_TEMPLATE"] = "oarepo_ui/header.html"
    app_config["THEME_HEADER_LOGIN_TEMPLATE"] = "oarepo_ui/header_login.html"

    app_config["OAREPO_UI_JINJAX_FILTERS"] = {"dummy": lambda *args, **kwargs: "dummy"}

    return app_config


@pytest.fixture(scope="module")
def create_app(instance_path, entry_points):
    """Application factory fixture."""
    return _create_app


@pytest.fixture(scope="module")
def record_service(app):
    from .model import ModelService, ModelServiceConfig

    service = ModelService(ModelServiceConfig())
    sregistry = app.extensions["invenio-records-resources"].registry
    sregistry.register(service, service_id="simple_model")
    return service


@pytest.fixture(scope="module")
def record_ui_resource_config(app):
    return ModelUIResourceConfig()


@pytest.fixture(scope="module")
def record_ui_resource(app, record_ui_resource_config, record_service):
    ui_resource = ModelUIResource(record_ui_resource_config)
    app.register_blueprint(
        ui_resource.as_blueprint(template_folder=Path(__file__).parent / "templates")
    )
    return ui_resource

@pytest.fixture(scope="module")
def test_record_ui_resource_config():
    config = ModelUIResourceConfig()
    config.application_id = 'Test'
    return config


@pytest.fixture(scope="module")
def test_record_ui_resource(app, test_record_ui_resource_config, record_service):
    ui_resource = ModelUIResource(test_record_ui_resource_config)
    app.register_blueprint(
        ui_resource.as_blueprint(template_folder=Path(__file__).parent / "templates")
    )
    return ui_resource


@pytest.fixture(scope="module")
def titlepage_ui_resource(
    app,
):
    ui_resource = TitlePageUIResource(TitlePageUIResourceConfig())
    app.register_blueprint(
        ui_resource.as_blueprint(template_folder=Path(__file__).parent / "templates")
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


@pytest.fixture(scope="module")
def users(app):
    """Create example users."""
    # This is a convenient way to get a handle on db that, as opposed to the
    # fixture, won't cause a DB rollback after the test is run in order
    # to help with test performance (creating users is a module -if not higher-
    # concern)
    from invenio_db import db

    with db.session.begin_nested():
        datastore = app.extensions["security"].datastore

        su_role = Role(name="superuser-access")
        db.session.add(su_role)

        su_action_role = ActionRoles.create(action=superuser_access, role=su_role)
        db.session.add(su_action_role)

        user1 = datastore.create_user(
            email="user1@example.org", password=hash_password("password"), active=True
        )
        user2 = datastore.create_user(
            email="user2@example.org", password=hash_password("password"), active=True
        )
        admin = datastore.create_user(
            email="admin@example.org", password=hash_password("password"), active=True
        )
        admin.roles.append(su_role)

    db.session.commit()
    return [user1, user2, admin]


@pytest.fixture
def simple_record(app, db, search_clear, record_service):
    from .model import ModelRecord

    record = record_service.create(
        system_identity,
        {},
    )
    ModelRecord.index.refresh()
    return record


@pytest.fixture()
def user(app, db):
    """Create example user."""
    with db.session.begin_nested():
        datastore = app.extensions["security"].datastore
        _user = datastore.create_user(
            email="info@inveniosoftware.org",
            password=hash_password("password"),
            active=True,
        )
    db.session.commit()
    return _user


@pytest.fixture()
def client_with_credentials(db, client, user):
    """Log in a user to the client."""

    action = current_access.actions["superuser-access"]
    db.session.add(ActionUsers.allow(action, user_id=user.id))

    login_user(user, remember=True)
    login_user_via_session(client, email=user.email)

    return client
