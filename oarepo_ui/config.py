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
}

OAREPO_UI_JINJAX_GLOBALS = {
    "array": "oarepo_ui.resources.templating.filters:ichain",
    "field_value": "oarepo_ui.resources.templating.filters:field_value",
    "field_data": "oarepo_ui.resources.templating.filters:field_data",
    "field_get": "oarepo_ui.resources.templating.filters:field_get",
}


# TODO: make sure that permissions here are correct and complete
OAREPO_UI_RECORD_ACTIONS = {
    # permissions from records
    "search",
    "create",
    "read",
    "update",
    "delete",
    "read_files",
    "update_files",
    "read_deleted_files",
    # permissions from drafts
    "edit",
    "new_version",
    "manage",
    "update_draft",
    "review",
    "view",
    "delete_draft",
    "manage_files",
    "manage_record_access",
}
