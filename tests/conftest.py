# -*- coding: utf-8 -*-
#
# Copyright (C) 2019 CESNET.
#
# Invenio OpenID Connect is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

"""Common pytest fixtures and plugins."""

from __future__ import absolute_import, print_function

import os
import shutil
import subprocess
import tempfile

import pytest
from config import RECORDS_REST_ENDPOINTS
from flask import Flask, make_response
from flask_login import LoginManager, login_user
from helpers import set_identity
from invenio_accounts.models import User
from invenio_base.signals import app_loaded
from invenio_i18n import InvenioI18N
from invenio_pidstore import InvenioPIDStore
from invenio_records_rest import InvenioRecordsREST
from invenio_records_rest.utils import PIDConverter
from invenio_records_rest.views import create_blueprint_from_app
from invenio_search import InvenioSearch

from oarepo_ui.ext import OARepoUIExt
from oarepo_ui.views import create_blueprint_from_app as ui_blueprint_from_app
from tests.config import RECORDS_REST_FACETS


@pytest.yield_fixture(scope="function")
def app(request):
    """Test mdcobject."""
    assert subprocess.call([
        'pybabel', 'compile', '-d', 'tests/translations/'
    ]) == 0

    instance_path = tempfile.mkdtemp()
    app = Flask('testapp', instance_path=instance_path)

    app.config.update(
        ACCOUNTS_JWT_ENABLE=False,
        INDEXER_DEFAULT_DOC_TYPE='record-v1.0.0',
        RECORDS_REST_DEFAULT_CREATE_PERMISSION_FACTORY=None,
        RECORDS_REST_DEFAULT_DELETE_PERMISSION_FACTORY=None,
        RECORDS_REST_DEFAULT_READ_PERMISSION_FACTORY=None,
        RECORDS_REST_DEFAULT_UPDATE_PERMISSION_FACTORY=None,
        SERVER_NAME='localhost:5000',
        JSONSCHEMAS_HOST='localhost:5000',
        CELERY_ALWAYS_EAGER=True,
        CELERY_RESULT_BACKEND='cache',
        CELERY_CACHE_BACKEND='memory',
        CELERY_EAGER_PROPAGATES_EXCEPTIONS=True,
        SQLALCHEMY_DATABASE_URI=os.environ.get(
            'SQLALCHEMY_DATABASE_URI', 'sqlite:///test.db'
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=True,
        SUPPORTED_LANGUAGES=["cs", "en"],
        TESTING=True,
        ELASTICSEARCH_DEFAULT_LANGUAGE_TEMPLATE={
            "type": "text",
            "fields": {
                "raw": {
                    "type": "keyword"
                }
            }
        },
        RECORDS_REST_FACETS=RECORDS_REST_FACETS,
        RECORDS_REST_ENDPOINTS=RECORDS_REST_ENDPOINTS,
        I18N_LANGUAGES=(
            ("cs", "Czech"),
        )
    )

    app.secret_key = 'changeme'

    InvenioI18N(app)
    OARepoUIExt(app)
    InvenioSearch(app)
    InvenioRecordsREST(app)
    InvenioPIDStore(app)
    app.url_map.converters['pid'] = PIDConverter

    # Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'login'

    @login_manager.user_loader
    def basic_user_loader(user_id):
        user_obj = User.query.get(int(user_id))
        return user_obj

    # app.register_blueprint(create_blueprint_from_app(app))

    @app.route('/test/login/<int:id>', methods=['GET', 'POST'])
    def test_login(id):
        print("test: logging user with id", id)
        response = make_response()
        user = User.query.get(id)
        login_user(user)
        set_identity(user)
        return response

    #
    app_loaded.send(app, app=app)
    app.register_blueprint(ui_blueprint_from_app(app))
    app.register_blueprint(create_blueprint_from_app(app))

    with app.app_context():
        yield app

    # Teardown instance path.
    shutil.rmtree(instance_path)


def client(app):
    with app.test_client() as client:
        yield client
