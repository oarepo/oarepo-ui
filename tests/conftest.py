import pytest
from invenio_app.factory import create_app as _create_app

from oarepo_ui.resources import RecordsUIResource, RecordsUIResourceConfig, BabelComponent

@pytest.fixture(scope="module")
def extra_entry_points():
    """Extra entry points to load the mock_module features."""
    return {"invenio_i18n.translations": ["1000-test = tests"]}


@pytest.fixture(scope="module")
def app_config(app_config):
    app_config["I18N_LANGUAGES"] = [("en", "English"), ("cs", "Czech")]
    app_config["BABEL_DEFAULT_LOCALE"] = "en"
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
    class Cfg(RecordsUIResourceConfig):
        api_service = "vocabularies"  # must be something included in oarepo, as oarepo is used in tests
        components = [BabelComponent]

    return Cfg


@pytest.fixture
def record_ui_resource(app, record_ui_resource_config):
    return RecordsUIResource(record_ui_resource_config)
