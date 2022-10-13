import pytest
from invenio_app.factory import create_api as _create_api

@pytest.fixture(scope="module")
def extra_entry_points():
    """Extra entry points to load the mock_module features."""
    return {
        "oarepo_model_builder_ui.components": [
            "row = mock_module.components:RowComponent",
            "list = mock_module.components:ListComponent",
            "column = mock_module.components:ColumnComponent"
        ],
    }

@pytest.fixture(scope="module")
def create_app(instance_path, entry_points):
    """Application factory fixture."""
    return _create_api