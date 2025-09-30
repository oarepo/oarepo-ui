#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations

import json
from datetime import timedelta
from typing import override

import pytest
from flask_webpackext.manifest import (
    JinjaManifest,
    JinjaManifestEntry,
    JinjaManifestLoader,
)
from invenio_app.factory import create_app as _create_app
from invenio_i18n import lazy_gettext as _
from invenio_records_resources.services.custom_fields import TextCF
from marshmallow_utils.fields import SanitizedHTML
from oarepo_runtime import current_runtime

from oarepo_ui.templating.data import FieldData

pytest_plugins = [
    "pytest_oarepo.files",
    "pytest_oarepo.records",
    "pytest_oarepo.fixtures",
    "pytest_oarepo.users",
]


@pytest.fixture(scope="module")
def extra_entry_points(record_model):
    """Extra entry points to load the mock_module features."""
    return {
        "invenio_i18n.translations": ["1000-test = tests"],
        "invenio_base.blueprints": ["ui_simple_model = tests.simple_model:create_blueprint"],
        "invenio_base.finalize_app": ["ui_simple_model = tests.simple_model:finalize_app"],
    }


#
# Mock the webpack manifest to avoid having to compile the full assets.
#
class MockJinjaManifest(JinjaManifest):
    """Mock manifest."""

    def __getitem__(self, key):
        """Get a manifest entry."""
        return JinjaManifestEntry(key, [key])

    def __getattr__(self, name):
        """Get a manifest entry."""
        return JinjaManifestEntry(name, [name])


class MockManifestLoader(JinjaManifestLoader):
    """Manifest loader creating a mocked manifest."""

    @override
    def load(self, filepath):
        """Load the manifest."""
        return MockJinjaManifest()


@pytest.fixture(scope="module")
def app_config(app_config):
    """Override pytest-invenio app_config fixture with custom test settings."""
    # Files storage
    app_config.update(
        FILES_REST_STORAGE_CLASS_LIST={"L": "Local"},
        FILES_REST_DEFAULT_STORAGE_CLASS="L",
    )

    # Records resolvers
    app_config.update(
        RECORDS_REFRESOLVER_CLS="invenio_records.resolver.InvenioRefResolver",
        RECORDS_REFRESOLVER_STORE="invenio_jsonschemas.proxies.current_refresolver_store",
    )

    # Theme
    app_config["THEME_FRONTPAGE"] = False
    app_config["THEME_SHOW_FRONTPAGE_INTRO_SECTION"] = True

    # DB engine (avoid defaults from invenio_app_rdm)
    app_config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": False,
        "pool_recycle": 3600,
    }

    # Custom fields
    app_config["RDM_NAMESPACES"] = {"cern": "https://greybook.cern.ch/"}
    app_config["RECORDS_CF_CUSTOM_FIELDS"] = {
        TextCF(
            name="cern:experiment",
            field_cls=SanitizedHTML,  # type: ignore[assignment]
        ),
    }
    app_config["DRAFTS_CF_CUSTOM_FIELDS"] = app_config["RECORDS_CF_CUSTOM_FIELDS"]

    app_config["RECORDS_CF_CUSTOM_FIELDS_UI"] = [
        {
            "section": _("CERN Experiment"),
            "fields": [
                {
                    "field": "cern:experiment",
                    "ui_widget": "RichInput",
                    "props": {
                        "label": "Experiment description",
                        "placeholder": "This experiment aims to...",
                        "icon": "pencil",
                        "description": ("You should fill this field with the experiment description.",),
                    },
                },
            ],
        },
    ]
    app_config["DRAFTS_CF_CUSTOM_FIELDS_UI"] = app_config["RECORDS_CF_CUSTOM_FIELDS_UI"]

    # RDM options
    app_config.update(
        RDM_PERSISTENT_IDENTIFIERS={},
        RDM_OPTIONAL_DOI_VALIDATOR=lambda _d, _p, **_k: True,
        DATACITE_TEST_MODE=True,
        RDM_RECORDS_ALLOW_RESTRICTION_AFTER_GRACE_PERIOD=True,
        RDM_RECORDS_RESTRICTION_GRACE_PERIOD=timedelta(days=30),
        RDM_ARCHIVE_DOWNLOAD_ENABLED=True,
    )

    # REST
    app_config["REST_CSRF_ENABLED"] = False

    # Misc / frontend
    app_config.update(
        IIIF_FORMATS=["jpg", "png"],
        APP_RDM_RECORD_THUMBNAIL_SIZES=[500],
        WEBPACKEXT_MANIFEST_LOADER=MockManifestLoader,
    )

    return app_config


@pytest.fixture(scope="module")
def create_app(instance_path, entry_points):
    """Application factory fixture."""
    return _create_app


@pytest.fixture(scope="module")
def record_service(app, record_model):
    return current_runtime.models["simple_model"].service


@pytest.fixture(scope="session")
def record_model():
    from oarepo_model.api import model
    from oarepo_model.presets.drafts import drafts_preset
    from oarepo_model.presets.records_resources import records_resources_preset
    from oarepo_model.presets.ui_links import ui_links_preset
    from oarepo_rdm.model.presets import rdm_preset

    model_instance = model(
        "simple-model",
        version="1.0.0",
        types=[
            {
                "Metadata": {
                    "properties": {
                        "title": {"type": "keyword"},
                    },
                },
            }
        ],
        metadata_type="Metadata",
        presets=[records_resources_preset, drafts_preset, rdm_preset, ui_links_preset],
        customizations=[],
        configuration={"ui_blueprint_name": "simple_model_ui"},
    )

    model_instance.register()
    return model_instance


def item_getter(fd: FieldData, path: tuple[str, ...]) -> FieldData | None:
    if path == ("metadata", "creators"):
        api_data = fd._api_data  # noqa: SLF001 ok to use private here
        ui_data = fd._ui_data  # noqa: SLF001 ok to use private here
        ui_definitions = fd._ui_definitions  # noqa: SLF001 ok to use private here
        original_item_getter = fd._item_getter  # noqa: SLF001 ok to use private here
        if not isinstance(ui_data, dict) or not isinstance(api_data, dict):
            return None
        ui_data_creators = ui_data.get("creators", {})
        ui_definitions = ui_definitions.get("children", {}).get(path[-1], {}) if ui_definitions else {}
        api_data_creators = {
            "creators": api_data.get("creators", []),
            "affiliations": ui_data_creators.get("affiliations", []),
        }

        return FieldData(
            api_data=api_data_creators,
            ui_data=ui_data_creators,
            ui_definitions=ui_definitions,
            path=path,
            item_getter=original_item_getter,
        )
    return None


def rdm_value():
    return json.loads(
        """
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
"""
    )


@pytest.fixture
def field_data_test_obj():
    api_value_serialization = rdm_value()
    ui_value_serialization = api_value_serialization.pop("ui")

    ui_definitions = {
        "children": {
            "metadata": {
                "children": {
                    "title": {
                        "help": "metadata/title.help",
                        "label": "metadata/title.label",
                        "hint": "metadata/title.hint",
                    },
                    "publication_date": {
                        "help": "metadata/publication_date.help",
                        "label": "metadata/publication_date.label",
                        "hint": "metadata/publication_date.hint",
                    },
                    "resource_type": {
                        "children": {
                            "id": {
                                "label": "metadata/resource_type/id.label",
                                "help": "TODO",
                                "hint": "TODO",
                            },
                            "title": {"label": "TODO"},
                        }
                    },
                },
            }
        }
    }
    # Can be called via __init__ but is supposed to be for internal use only
    record = FieldData.create(
        api_data=api_value_serialization,
        ui_data={"ui": ui_value_serialization},
        ui_definitions=ui_definitions,
        item_getter=item_getter,
    )

    return api_value_serialization, ui_value_serialization, record
