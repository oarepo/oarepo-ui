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
from invenio_records_resources.services.custom_fields import KeywordCF

from tests.model import (
    ModelResource,
    ModelResourceConfig,
    ModelUIResource,
    ModelUIResourceConfig,
    TitlePageUIResource,
    TitlePageUIResourceConfig,
)
import json
from oarepo_ui.resources.templating.data import FieldData

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
    app_config["RECORDS_REFRESOLVER_CLS"] = (
        "invenio_records.resolver.InvenioRefResolver"
    )
    app_config["RECORDS_REFRESOLVER_STORE"] = (
        "invenio_jsonschemas.proxies.current_refresolver_store"
    )

    # for ui tests
    app_config["APP_THEME"] = ["semantic-ui"]
    app_config["THEME_SEARCHBAR"] = False
    app_config["THEME_HEADER_TEMPLATE"] = "oarepo_ui/header.html"
    app_config["THEME_HEADER_LOGIN_TEMPLATE"] = "oarepo_ui/header_login.html"

    app_config["OAREPO_UI_JINJAX_FILTERS"] = {"dummy": lambda *args, **kwargs: "dummy"}

    app_config["NESTED_CF"] = [KeywordCF("aaa")]

    app_config["INLINE_CF"] = [KeywordCF("bbb")]

    app_config["NESTED_CF_UI"] = [
        {"section": "A", "fields": [{"field": "aaa", "ui_widget": "Input"}]}
    ]

    app_config["INLINE_CF_UI"] = [
        {"section": "B", "fields": [{"field": "bbb", "ui_widget": "Input"}]}
    ]

    app_config["WEBPACKEXT_PROJECT"] = "oarepo_ui.webpack:project"

    app_config["RDM_MODELS"] = [
        {
            "service_id": "simple_model",
            "api_service": "tests.model.ModelService",
            "api_service_config": "tests.model.ModelServiceConfig",
            "api_resource": "tests.model.ModelResource",
            "api_resource_config": "tests.model.ModelResourceConfig",
            "ui_resource_config": "tests.model.ModelUIResourceConfig",
        }
    ]

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
def record_api_resource_config(app):
    return ModelResourceConfig()


@pytest.fixture(scope="module")
def record_api_resource(app, record_api_resource_config, record_service):
    resource = ModelResource(record_api_resource_config, record_service)
    app.register_blueprint(
        resource.as_blueprint(template_folder=Path(__file__).parent / "templates")
    )
    return resource


@pytest.fixture(scope="module")
def test_record_ui_resource_config():
    config = ModelUIResourceConfig()
    config.application_id = "Test"
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


@pytest.fixture()
def record_cf(app, db, cache):
    from oarepo_runtime.services.custom_fields.mappings import prepare_cf_indices

    prepare_cf_indices()


def rdm_value():
    return json.loads("""
	{
		"id": "etzwa-8rf92",
		"created": "2025-07-10T14:17:12.171491+00:00",
		"updated": "2025-07-10T14:17:12.271642+00:00",
		"links": {
			"self": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92",
			"self_html": "https://inveniordm.web.cern.ch/records/etzwa-8rf92",
			"self_doi": "https://inveniordm.web.cern.ch/doi/10.81088/etzwa-8rf92",
			"doi": "https://handle.stage.datacite.org/10.81088/etzwa-8rf92",
			"parent": "https://inveniordm.web.cern.ch/api/records/bpmtx-jfm32",
			"parent_html": "https://inveniordm.web.cern.ch/records/bpmtx-jfm32",
			"parent_doi": "https://inveniordm.web.cern.ch/doi/10.81088/bpmtx-jfm32",
			"self_iiif_manifest": "https://inveniordm.web.cern.ch/api/iiif/record:etzwa-8rf92/manifest",
			"self_iiif_sequence": "https://inveniordm.web.cern.ch/api/iiif/record:etzwa-8rf92/sequence/default",
			"files": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/files",
			"media_files": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/media-files",
			"archive": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/files-archive",
			"archive_media": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/media-files-archive",
			"latest": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/versions/latest",
			"latest_html": "https://inveniordm.web.cern.ch/records/etzwa-8rf92/latest",
			"draft": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/draft",
			"versions": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/versions",
			"access_links": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/access/links",
			"access_grants": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/access/grants",
			"access_users": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/access/users",
			"access_groups": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/access/groups",
			"access_request": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/access/request",
			"access": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/access",
			"reserve_doi": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/draft/pids/doi",
			"communities": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/communities",
			"communities-suggestions": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/communities-suggestions",
			"requests": "https://inveniordm.web.cern.ch/api/records/etzwa-8rf92/requests"
		},
		"revision_id": 4,
		"parent": {
			"id": "bpmtx-jfm32",
			"access": {
				"owned_by": {
					"user": "492"
				},
				"settings": {
					"allow_user_requests": false,
					"allow_guest_requests": false,
					"accept_conditions_text": null,
					"secret_link_expiration": 0
				}
			},
			"communities": {},
			"pids": {
				"doi": {
					"identifier": "10.81088/bpmtx-jfm32",
					"provider": "datacite",
					"client": "datacite"
				}
			}
		},
		"versions": {
			"is_latest": true,
			"index": 2
		},
		"is_published": true,
		"is_draft": false,
		"pids": {
			"doi": {
				"identifier": "10.81088/etzwa-8rf92",
				"provider": "datacite",
				"client": "datacite"
			},
			"oai": {
				"identifier": "oai:inveniordm.web.cern.ch:etzwa-8rf92",
				"provider": "oai"
			}
		},
		"metadata": {
			"resource_type": {
				"id": "image-photo",
				"title": {
					"de": "Foto",
					"en": "Photo",
					"sv": "Foto"
				}
			},
			"creators": [
				{
					"person_or_org": {
						"type": "personal",
						"name": "Hufnágl, Pišta",
						"given_name": "Pišta",
						"family_name": "Hufnágl"
					},
					"role": {
						"id": "other",
						"title": {
							"de": "Andere",
							"en": "Other",
							"sv": "Övriga"
						}
					}
				},
                {
                    "person_or_org": {
                        "type": "personal",
                        "name": "Testovací, Dummy",
                        "given_name": "Dummy",
                        "family_name": "Testovací"
                    },
                    "role": {
                    "id": "other",
                    "title": {
                        "de": "Andere",
                        "en": "Other",
                        "sv": "Övriga"
                        }
                    }
                }
			],
			"title": "Pištův testovací záznam",
			"publisher": "DMiksik",
			"publication_date": "2025-07-10",
			"description": "<p>fotočka</p>"
            
		},
		"custom_fields": {},
		"access": {
			"record": "public",
			"files": "public",
			"embargo": {
				"active": false,
				"reason": null
			},
			"status": "open"
		},
		"files": {
			"enabled": true,
			"default_preview": "jaycee-xie-unsplash-shiba.png",
			"order": [],
			"count": 1,
			"total_bytes": 914231,
			"entries": {
				"jaycee-xie-unsplash-shiba.png": {
					"id": "2c74d7cb-de54-4c15-a162-3d14dc15f2a9",
					"checksum": "md5:b96a0e6d3fafd0c7961df26988f11cd9",
					"ext": "png",
					"size": 914231,
					"mimetype": "image/png",
					"key": "jaycee-xie-unsplash-shiba.png",
					"metadata": {
						"width": 960,
						"height": 640
					},
					"access": {
						"hidden": false
					}
				}
			}
		},
		"media_files": {
			"enabled": false,
            "dummy_field": true,
			"order": [],
			"count": 0,
			"total_bytes": 0,
            "dummy_total_bytes": 123,
            "dummy_field_empty_string": "",
            "dummy_field_not_empty_string": "not_empty",
			"entries": {}
		},
		"status": "published",
		"deletion_status": {
			"is_deleted": false,
			"status": "P"
		},
		"stats": {
			"this_version": {
				"views": 0,
				"unique_views": 0,
				"downloads": 0,
				"unique_downloads": 0,
				"data_volume": {
					"source": "0.0",
					"parsedValue": 0
				}
			},
			"all_versions": {
				"views": 0,
				"unique_views": 0,
				"downloads": 0,
				"unique_downloads": 0,
				"data_volume": {
					"source": "0.0",
					"parsedValue": 0
				}
			}
		},
		"ui": {
			"publication_date_l10n_medium": "Jul 10, 2025",
			"publication_date_l10n_long": "July 10, 2025",
			"created_date_l10n_long": "July 10, 2025",
			"updated_date_l10n_long": "July 10, 2025",
			"resource_type": {
				"id": "image-photo",
				"title_l10n": "Photo"
			},
			"custom_fields": {},
			"access_status": {
				"id": "open",
				"title_l10n": "Open",
				"description_l10n": "The record and files are publicly accessible.",
				"icon": "unlock",
				"embargo_date_l10n": null,
				"message_class": ""
			},
            "creators": {
                "creators": [
                    {
                        "person_or_org": {
                            "type": "personal",
                            "name": "Hufnágl, Pišta",
                            "given_name": "Pišta",
                            "family_name": "Hufnágl"
                        },
                        "role": {
                            "id": "other",
                            "title": "Other"
                        }
                    },
                    {
                    "person_or_org": {
                            "type": "personal",
                            "name": "Testovací, Dummy",
                            "given_name": "Dummy",
                            "family_name": "Testovací"
                        },
                        "role": {
                            "id": "other",
                            "title":"Other"
                        } 
                    }
			    ],
                "affiliations": []
            },
			"description_stripped": "fotočka",
			"version": "v2",
			"is_draft": false
		}
	}
""")

def item_getter(fd:FieldData, path: list[str]):
    if path == ['metadata', 'creators']:
        ui_data_creators = fd._ui_data.get('creators', {})
        ui_definitions = fd._ui_definitions.get('children', {}).get(path[-1],{})
        api_data_creators = {
            'creators': fd._api_data.get('creators',[]),
            'affiliations': ui_data_creators.get('affiliations',[])
            }
        
        return FieldData(api_data=api_data_creators, 
                         ui_data=ui_data_creators, 
                         ui_definitions=ui_definitions, 
                         path=path,
                         item_getter=fd._item_getter)

@pytest.fixture()
def field_data_test_obj():
    api_value_serialization = rdm_value() 
    ui_value_serialization = api_value_serialization.pop("ui")   

    ui_definitions = {
        'children': {
            'metadata': {
                'children': {
                    'title': {
                        "help": "metadata/title.help",
                        "label": "metadata/title.label",
                        "hint": "metadata/title.hint",
                    },
                    'publication_date': {
                        "help": "metadata/publication_date.help",
                        "label": "metadata/publication_date.label",
                        "hint": "metadata/publication_date.hint",
                    },
                    'resource_type':{
                        'children': {
                            'id': {
                                'label': "metadata/resource_type/id.label",
                                'help':"TODO",
                                'hint':"TODO"    
                            },
                            'title':{
                                'label': "TODO"
                            }
                        }
                    }
                },
            }
        }
    }
    # Can be called via __init__ but is supposed to be for internal use only
    record = FieldData.create(api_data=api_value_serialization, ui_data={"ui": ui_value_serialization}, ui_definitions=ui_definitions, item_getter=item_getter)
    
    return api_value_serialization, ui_value_serialization, record
    