# OAREPO_UI_BUILD_FRAMEWORK = 'vite'
OAREPO_UI_BUILD_FRAMEWORK = "webpack"

# this is set as environment variable when running nrp develop
OAREPO_UI_DEVELOPMENT_MODE = False

# We set this to avoid https://github.com/inveniosoftware/invenio-administration/issues/180
THEME_HEADER_LOGIN_TEMPLATE = "oarepo_ui/header_login.html"

OAREPO_UI_JINJAX_FILTERS = {
    "id": "oarepo_ui.resources.templating.filters:id_filter",
    "to_dict": "oarepo_ui.resources.templating.filters:to_dict_filter",
    "type": "oarepo_ui.resources.templating.filters:type_filter",
    "keys": "oarepo_ui.resources.templating.filters:keys_filter",
    "ijoin": "oarepo_ui.resources.templating.filters:ijoin_filter",
    "compact_number": "invenio_app_rdm.records_ui.views.filters:compact_number",
    "localize_number": "invenio_app_rdm.records_ui.views.filters:localize_number",
    "truncate_number": "invenio_app_rdm.records_ui.views.filters:truncate_number",
}

OAREPO_UI_JINJAX_GLOBALS = {
    "array": "oarepo_ui.resources.templating.filters:ichain",
    "field_value": "oarepo_ui.resources.templating.filters:field_value",
    "field_data": "oarepo_ui.resources.templating.filters:field_data",
    "field_get": "oarepo_ui.resources.templating.filters:field_get",
}


OAREPO_UI_RECORD_ACTIONS = {
    "search",
    "create",
    "read",
    "update",
    "delete",
    "read_files",
    "update_files",
    "read_deleted_files",
    "edit",
    "new_version",
    "manage",
    "review",
    "view",
    "manage_files",
    "manage_record_access",
}

OAREPO_UI_DRAFT_ACTIONS = {
    "read_draft": "read",
    "update_draft": "update",
    "delete_draft": "delete",
    "draft_read_files": "read_files",
    "draft_update_files": "update_files",
    "draft_read_deleted_files": "read_deleted_files",
    "manage": "manage",  # add manage to draft actions - it is the same for drafts as well as published
    "manage_files": "manage_files",
    "manage_record_access": "manage_record_access",
}

MATOMO_ANALYTICS_TEMPLATE = "oarepo_ui/matomo_analytics.html"
