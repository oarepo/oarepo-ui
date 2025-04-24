# -*- coding: utf-8 -*-
#
# This file is part of Invenio.
# Copyright (C) 2015-2018 CERN.
#
# Invenio is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

"""JS/CSS bundles for oarepo-ui.

You include one of the bundles in a page like the example below (using
``base`` bundle as an example):

 .. code-block:: html

    {{ webpack['base.js']}}

"""

from invenio_assets.webpack import WebpackThemeBundle
from oarepo import __version__ as oarepo_version

if oarepo_version.startswith("11."):
    dependencies = {
        "@tanstack/react-query": "^4.32.0",
        "@babel/runtime": "^7.9.0",
        "@ckeditor/ckeditor5-build-classic": "^16.0.0",
        "@ckeditor/ckeditor5-react": "^2.1.0",
        "formik": "^2.1.0",
        "i18next": "^20.3.0",
        "i18next-browser-languagedetector": "^6.1.0",
        "luxon": "^1.23.0",
        "path": "^0.12.7",
        "prop-types": "^15.7.2",
        "react-copy-to-clipboard": "^5.0.0",
        "react-dnd": "^11.1.0",
        "react-dnd-html5-backend": "^11.1.0",
        "react-dropzone": "^11.0.0",
        "react-i18next": "^11.11.0",
        "react-invenio-deposit": "^1.0.0",
        "react-invenio-forms": "^1.0.0",
        "react-searchkit": "^2.0.0",
        "yup": "^0.32.0",
        "lodash": "^4.17.0",
        "react-text-truncate": "^0.19.0",
        "react-datepicker": "^4.21.0",
        "edtf": "^4.0.0",
    }
    aliases = {
        "../../theme.config$": "less/theme.config",
        "../../less/site": "less/site",
        "../../less": "less",
    }

else:
    # RDM 12 webpack dependencies are already included in the oarepo python package, so we just include
    # those used in our own components here
    dependencies = {
        "react-datepicker": "^4.21.0",
        "edtf": "^4.0.0",
        "html-entities": "2.5.2",
        "sanitize-html": "2.13.0",
        "d3": "^7.8.5",
        "@oarepo/file-manager": "^1.1.0",
    }
    aliases = {}

theme = WebpackThemeBundle(
    __name__,
    "assets",
    default="semantic-ui",
    themes={
        "semantic-ui": dict(
            entry={
                "oarepo_ui": "./js/oarepo_ui/index.js",
                "oarepo_ui_search": "./js/oarepo_ui/search/index.js",
                "oarepo_ui_forms": "./js/oarepo_ui/forms/index.js",
                "oarepo_ui_theme": "./js/oarepo_ui/theme.js",
                "oarepo_ui_components": "./js/oarepo_ui/custom-components.js",
                "copy_to_clipboard": "./js/oarepo_ui/components/clipboard.js",
                "record_export": "./js/oarepo_ui/components/record-export.js",
                "record_versions": "./js/oarepo_ui/components/record-versions.js",
                "record_sharing": "./js/oarepo_ui/components/record-sharing.js",
            },
            dependencies=dependencies,
            devDependencies={"eslint-plugin-i18next": "^6.0.3"},
            aliases={
                **aliases,
                "@translations/oarepo_ui": "translations/oarepo_ui",
                # search and edit
                "@less/oarepo_ui": "less/oarepo_ui",
                "@js/oarepo_ui": "js/oarepo_ui",
                # hack for communities being dependent on RDM
                "@translations/invenio_app_rdm/i18next": "translations/oarepo_ui/i18next.js",
                # hack for vocabularies being dependent on RDM
                "@translations/invenio_rdm_records/i18next": "translations/oarepo_ui/i18next.js",
                # another hack for communities
                "@templates/custom_fields": "js/custom_fields",
            },
        )
    },
)
