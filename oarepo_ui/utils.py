from marshmallow import Schema, fields
from marshmallow.schema import SchemaMeta
from marshmallow_utils.fields import NestedAttribute
from flask import session, current_app, g
from invenio_base.utils import obj_or_import_string


def dump_empty(schema_or_field):
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
        # return [dump_empty(schema_or_field.inner)]
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


view_deposit_page_permission_key = "view_deposit_page_permission"


# check if the user has the right to access the deposit page and store the results in session
def can_view_deposit_page():
    permission_to_deposit = False
    if view_deposit_page_permission_key in session:
        return session[view_deposit_page_permission_key]

    repository_search_resources = current_app.config.get("GLOBAL_SEARCH_MODELS", [])
    if not repository_search_resources:
        return False
    for search_resource in repository_search_resources:
        search_resource_service = search_resource.get("model_service", None)
        search_resource_config = search_resource.get("service_config", None)
        if search_resource_service and search_resource_config:
            try:
                service_def = obj_or_import_string(search_resource_service)
                service_cfg = obj_or_import_string(search_resource_config)
                service = service_def(service_cfg())
                permission_to_deposit = service.check_permission(
                    g.identity, "view_deposit_page", record=None
                )
                if permission_to_deposit:
                    break
            except ImportError:
                continue
    session[view_deposit_page_permission_key] = permission_to_deposit
    return permission_to_deposit


def clear_view_deposit_page_permission_from_session(*args, **kwargs):
    session.pop(view_deposit_page_permission_key, None)
