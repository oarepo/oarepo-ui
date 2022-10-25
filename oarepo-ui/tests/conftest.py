from oarepo_ui import OARepoUIExtension
import os
import shutil
import sys
import pytest
import tempfile
from flask import Flask


@pytest.fixture(scope="module")
def app():
    """Flask application fixture."""
    # Set temporary instance path for sqlite
    instance_path = tempfile.mkdtemp()
    app = Flask("testapp", instance_path=instance_path)
    app.config.update(TESTING=True)
    OARepoUIExtension(app)

    with app.app_context():
        yield app

    # Teardown instance path.
    shutil.rmtree(instance_path)