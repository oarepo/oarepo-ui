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

from __future__ import annotations

from invenio_assets.webpack import WebpackThemeBundle

theme = WebpackThemeBundle(
    __name__,
    "assets",
    default="semantic-ui",
    themes={
        "semantic-ui": {
            "entry": {
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
            "dependencies": {
                "react-datepicker": "^4.21.0",
                "edtf": "^4.0.0",
                "html-entities": "2.5.2",
                "sanitize-html": "2.13.0",
                "d3": "^7.8.5",
                "@oarepo/file-manager": "^1.1.0",
                "react-error-boundary": "^6.0.0",
                "react-textarea-autosize": "^8.5.0",
                "@tanstack/react-query": "^4",
            },
            "devDependencies": {"eslint-plugin-i18next": "^6.0.3"},
            "aliases": {
                "@translations/oarepo_ui": "translations/oarepo_ui",
                # search and edit
                "@less/oarepo_ui": "less/oarepo_ui",
                "@js/oarepo_ui": "js/oarepo_ui",
            },
        }
    },
)
