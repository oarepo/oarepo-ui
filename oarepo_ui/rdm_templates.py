#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI RDM blueprints.

This module contains blueprints to register just the
templates & statics from various invenio-app-rdm blueprint entry-points.
"""

from __future__ import annotations

from flask import Blueprint, Flask
from invenio_app_rdm.records_ui.searchapp import search_app_context as records_search_app_context
from invenio_app_rdm.records_ui.views.filters import (
    can_list_files,
    compact_number,
    custom_fields_search,
    get_scheme_label,
    has_images,
    has_previewable_files,
    localize_number,
    make_files_preview_compatible,
    namespace_url,
    order_entries,
    pid_url,
    select_preview_file,
    to_previewer_files,
    transform_record,
    truncate_number,
)
from invenio_app_rdm.users_ui.searchapp import search_app_context as users_search_app_context
from invenio_collections.searchapp import search_app_context as c_search_app_context


def records_blueprint(app: Flask) -> Blueprint:  # noqa: ARG001
    """Template blueprint for RDM records."""
    blueprint = Blueprint(
        "templates_app_rdm_records",
        "invenio_app_rdm.records_ui",
        template_folder="templates",
    )

    # Register template filters
    blueprint.add_app_template_filter(can_list_files)
    blueprint.add_app_template_filter(make_files_preview_compatible)
    blueprint.add_app_template_filter(pid_url)
    blueprint.add_app_template_filter(select_preview_file)
    blueprint.add_app_template_filter(to_previewer_files)
    blueprint.add_app_template_filter(has_previewable_files)
    blueprint.add_app_template_filter(order_entries)
    blueprint.add_app_template_filter(get_scheme_label)
    blueprint.add_app_template_filter(has_images)
    blueprint.add_app_template_filter(localize_number)
    blueprint.add_app_template_filter(compact_number)
    blueprint.add_app_template_filter(truncate_number)
    blueprint.add_app_template_filter(namespace_url)
    blueprint.add_app_template_filter(custom_fields_search)
    blueprint.add_app_template_filter(transform_record)

    # Register context processor
    blueprint.app_context_processor(records_search_app_context)

    return blueprint


def rdm_blueprint(app: Flask) -> Blueprint:  # noqa: ARG001
    """Template blueprint for RDM."""
    return Blueprint(
        "templates_app_rdm",
        "invenio_app_rdm.theme",
        template_folder="templates",
        static_folder="static",
    )


def requests_blueprint(app: Flask) -> Blueprint:  # noqa: ARG001
    """Template blueprint for RDM requests."""
    blueprint = Blueprint(
        "templates_app_rdm_requests",
        "invenio_app_rdm.requests_ui",
        template_folder="templates",
        static_folder="static",
    )
    blueprint.app_context_processor(records_search_app_context)
    return blueprint


def communities_blueprint(app: Flask) -> Blueprint:  # noqa: ARG001
    """Template blueprint for RDM communities."""
    blueprint = Blueprint(
        "templates_app_rdm_communities",
        "invenio_app_rdm.communities_ui",
        template_folder="templates",
        static_folder="static",
    )
    blueprint.app_context_processor(records_search_app_context)
    blueprint.app_context_processor(c_search_app_context)
    return blueprint


def users_blueprint(app: Flask) -> Blueprint:  # noqa: ARG001
    """Template blueprint for RDM users."""
    blueprint = Blueprint(
        "templates_app_rdm_users",
        "invenio_app_rdm.users_ui",
        template_folder="templates",
        static_folder="static",
    )
    blueprint.app_context_processor(users_search_app_context)
    return blueprint


def administration_blueprint(app: Flask) -> Blueprint:  # noqa: ARG001
    """Template blueprint for RDM administration."""
    return Blueprint(
        "templates_app_rdm_administration",
        "invenio_app_rdm.administration",
        template_folder="templates",
        static_folder="static",
    )
