# OAREPO_UI_BUILD_FRAMEWORK = 'vite'
OAREPO_UI_BUILD_FRAMEWORK = "webpack"

# this is set as environment variable when running nrp develop
OAREPO_UI_DEVELOPMENT_MODE = False

# We set this to avoid https://github.com/inveniosoftware/invenio-administration/issues/180
THEME_HEADER_LOGIN_TEMPLATE = "oarepo_ui/header_login.html"

OAREPO_UI_JINJAX_FILTERS = {}

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
