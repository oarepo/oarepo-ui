from flask import current_app
from invenio_i18n.ext import current_i18n
from invenio_records_resources.services.records.components import ServiceComponent


class BabelComponent(ServiceComponent):
    def form_config(
        self, *, form_config, resource, record, view_args, identity, **kwargs
    ):
        conf = current_app.config
        locales = []
        for l in current_i18n.get_locales():
            # Avoid duplicate language entries
            if l.language in [lang["value"] for lang in locales]:
                continue

            option = {"value": l.language, "text": l.get_display_name()}
            locales.append(option)

        form_config.setdefault("current_locale", str(current_i18n.locale))
        form_config.setdefault("default_locale", conf.get("BABEL_DEFAULT_LOCALE", "en"))
        form_config.setdefault("locales", locales)


class PermissionsComponent(ServiceComponent):
    def get_record_permissions(self, actions, service, identity, record=None):
        """Helper for generating (default) record action permissions."""
        return {
            f"can_{action}": service.check_permission(identity, action, record=record)
            for action in actions
        }

    def before_ui_detail(self, *, resource, record, extra_context, identity, **kwargs):
        self.fill_permissions(resource, record, extra_context, identity)

    def before_ui_edit(self, *, resource, record, extra_context, identity, **kwargs):
        self.fill_permissions(resource, record, extra_context, identity)

    def before_ui_create(self, *, resource, record, extra_context, identity, **kwargs):
        self.fill_permissions(resource, record, extra_context, identity)

    def before_ui_search(
        self, *, resource, extra_context, identity, search_options, **kwargs
    ):
        extra_context["permissions"] = self.get_record_permissions(
            ["create"], resource.api_service, identity
        )
        search_options["permissions"] = extra_context["permissions"]

    def form_config(
        self, *, form_config, resource, record, view_args, identity, **kwargs
    ):
        self.fill_permissions(resource, record, form_config, identity)

    def fill_permissions(self, resource, record, extra_context, identity):
        extra_context["permissions"] = self.get_record_permissions(
            [
                "edit",
                "new_version",
                "manage",
                "update_draft",
                "read_files",
                "review",
                "view",
                "delete_draft",
                "manage_files",
                "manage_record_access",
            ],
            resource.api_service,
            identity,
            record,
        )
