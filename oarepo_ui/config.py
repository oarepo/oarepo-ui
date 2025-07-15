# OAREPO_UI_BUILD_FRAMEWORK = 'vite'
OAREPO_UI_BUILD_FRAMEWORK = "webpack"

# this is set as environment variable when running nrp develop
OAREPO_UI_DEVELOPMENT_MODE = False

# We set this to avoid https://github.com/inveniosoftware/invenio-administration/issues/180
THEME_HEADER_LOGIN_TEMPLATE = "oarepo_ui/header_login.html"

OAREPO_UI_THEME_HEADER_FRONTPAGE = "oarepo_ui/header_frontpage.html"

# TODO: check for all removed filters in templates
OAREPO_UI_JINJAX_FILTERS = {
    "compact_number": "invenio_app_rdm.records_ui.views.filters:compact_number",
    "localize_number": "invenio_app_rdm.records_ui.views.filters:localize_number",
    "truncate_number": "invenio_app_rdm.records_ui.views.filters:truncate_number",
    "as_dict": "oarepo_ui.resources.templating.filters:as_dict",
}

OAREPO_UI_JINJAX_GLOBALS = {
    "ui_value": "oarepo_ui.resources.templating.filters:ui_value",
    "as_array": "oarepo_ui.resources.templating.filters:as_array",
    "value": "oarepo_ui.resources.templating.filters:value",
    "as_dict": "oarepo_ui.resources.templating.filters:as_dict"
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
