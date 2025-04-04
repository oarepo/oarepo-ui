"""Oarepo ui utils module."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Optional, overload

from flask import current_app, g, session
from flask_login import current_user
from invenio_base.utils import obj_or_import_string
from marshmallow import Schema, fields
from marshmallow.schema import SchemaMeta
from marshmallow_utils.fields import NestedAttribute

if TYPE_CHECKING:
    from invenio_records_resources.services.records import RecordService


@overload
def dump_empty(schema_or_field: Schema) -> dict: ...


@overload
def dump_empty(schema_or_field: SchemaMeta) -> dict: ...


@overload
def dump_empty(schema_or_field: fields.List) -> list: ...


@overload
def dump_empty(schema_or_field: fields.Nested | NestedAttribute) -> dict: ...


@overload
def dump_empty(schema_or_field: fields.Str) -> str: ...


@overload
def dump_empty(schema_or_field: fields.Dict) -> dict: ...


@overload
def dump_empty(schema_or_field: object) -> None: ...


def dump_empty(
    schema_or_field: (
        Schema
        | SchemaMeta
        | fields.List
        | fields.Nested
        | NestedAttribute
        | fields.Str
        | fields.Dict
        | object
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
        return dump_empty(nested_schema)
    if isinstance(schema_or_field, fields.Str):
        return ""
    if isinstance(schema_or_field, fields.Dict):
        return {}
    return None


view_deposit_page_permission_key: str = "view_deposit_page_permission"


def can_view_deposit_page() -> bool:
    """Check if the current user can view the deposit page."""
    permission_to_deposit: bool = False

    if not current_user.is_authenticated:
        return False

    if view_deposit_page_permission_key in session:
        return bool(session[view_deposit_page_permission_key])

    repository_search_resources: list[dict[str, str]] = current_app.config.get(
        "GLOBAL_SEARCH_MODELS", []
    )

    if not repository_search_resources:
        return False

    for search_resource in repository_search_resources:
        search_resource_service: Optional[str] = search_resource.get(
            "model_service", None
        )
        search_resource_config: Optional[str] = search_resource.get(
            "service_config", None
        )

        if search_resource_service and search_resource_config:
            try:
                service_def: Any = obj_or_import_string(search_resource_service)
                service_cfg: Any = obj_or_import_string(search_resource_config)

                # Instantiate service and check permission
                service: RecordService = service_def(service_cfg())
                permission_to_deposit = service.check_permission(
                    g.identity, "view_deposit_page", record=None
                )
                if permission_to_deposit:
                    break
            except ImportError:
                continue

    # Cache permission result in session
    session[view_deposit_page_permission_key] = permission_to_deposit
    return permission_to_deposit


def clear_view_deposit_page_permission_from_session(*args: Any, **kwargs: Any) -> None:
    """Clear the cached permission for viewing the deposit page from the session."""
    session.pop(view_deposit_page_permission_key, None)
