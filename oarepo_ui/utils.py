#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI utils module.

This module provides utility functions for OARepo UI, including schema dumping
functions for generating empty data structures and permission checking utilities
for deposit page access control.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, overload

from flask import g, session
from flask_login import current_user
from marshmallow import Schema, fields
from marshmallow.schema import SchemaMeta
from marshmallow_utils.fields import NestedAttribute
from oarepo_runtime import Model, current_runtime

if TYPE_CHECKING:
    from invenio_records_resources.services.records import RecordService


@overload
def dump_empty(  # pyright: ignore[reportOverlappingOverload]
    schema_or_field: Schema,
) -> dict: ...


@overload
def dump_empty(schema_or_field: SchemaMeta) -> dict: ...  # type: ignore[overload-cannot-match]


@overload
def dump_empty(schema_or_field: fields.List) -> list: ...  # type: ignore[overload-cannot-match]


@overload
def dump_empty(schema_or_field: fields.Nested | NestedAttribute) -> dict: ...  # type: ignore[overload-cannot-match]


@overload
def dump_empty(schema_or_field: fields.Str) -> str: ...  # type: ignore[overload-cannot-match]


@overload
def dump_empty(schema_or_field: fields.Dict) -> dict: ...  # type: ignore[overload-cannot-match]


@overload
def dump_empty(schema_or_field: object) -> None: ...  # type: ignore[overload-cannot-match]


def dump_empty(  # noqa: PLR0911 too many return branches
    schema_or_field: (
        Schema | SchemaMeta | fields.List | fields.Nested | NestedAttribute | fields.Str | fields.Dict | object
    ),
) -> dict | list | str | None:
    """Return a full json-compatible dict of schema representation with empty values."""
    if isinstance(schema_or_field, (Schema,)):
        schema = schema_or_field
        return {k: dump_empty(v) for (k, v) in schema.fields.items()}
    if isinstance(schema_or_field, SchemaMeta):
        # Nested fields can pass a Schema class (SchemaMeta)
        # or a Schema instance.
        # Schema classes need to be instantiated to get .fields
        schema = schema_or_field()
        return {k: dump_empty(v) for (k, v) in schema.fields.items()}
    if isinstance(schema_or_field, fields.List):
        return []
    if isinstance(schema_or_field, (NestedAttribute, fields.Nested)):
        field = schema_or_field
        nested_schema = field.nested
        if callable(nested_schema):
            nested_schema = nested_schema()
        return dump_empty(nested_schema)  # type: ignore[no-any-return]
    if isinstance(schema_or_field, fields.Str):
        return ""
    if isinstance(schema_or_field, fields.Dict):
        return {}
    return None


view_deposit_page_permission_key: str = "view_deposit_page_permission"


def can_view_deposit_page(model_name: str | None = None) -> bool:
    """Check if the current user can view the deposit page."""
    permission_to_deposit: bool = False

    if not current_user.is_authenticated:
        return False
    if view_deposit_page_permission_key in session:
        return bool(session[view_deposit_page_permission_key])

    models: dict[str, Model] = (
        current_runtime.models if model_name is None else {model_name: current_runtime.models[model_name]}
    )

    if not models:
        return False
    for model in models:
        # Instantiate service and check permission
        service: RecordService = current_runtime.models[model].service
        permission_to_deposit = service.check_permission(g.identity, "view_deposit_page", record=None)
        if permission_to_deposit:
            break

    # Cache permission result in session
    session[view_deposit_page_permission_key] = permission_to_deposit
    return permission_to_deposit


def clear_view_deposit_page_permission_from_session(
    *args: Any,  # noqa: ARG001 added to match signature of signal
    **kwargs: Any,  # noqa: ARG001 added to match signature of signal
) -> None:
    """Clear the cached permission for viewing the deposit page from the session."""
    session.pop(view_deposit_page_permission_key, None)
