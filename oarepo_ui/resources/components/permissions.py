from ...proxies import current_oarepo_ui
from .base import UIResourceComponent


class PermissionsComponent(UIResourceComponent):
    def before_ui_detail(self, *, api_record, extra_context, identity, **kwargs):
        self.fill_permissions(api_record._record, extra_context, identity)

    def before_ui_edit(self, *, api_record, extra_context, identity, **kwargs):
        self.fill_permissions(api_record._record, extra_context, identity)

    def before_ui_create(self, *, extra_context, identity, **kwargs):
        self.fill_permissions(None, extra_context, identity)

    def before_ui_search(self, *, extra_context, identity, search_options, **kwargs):
        from ..resource import RecordsUIResource

        if not isinstance(self.resource, RecordsUIResource):
            return

        extra_context["permissions"] = {
            "can_create": self.resource.has_deposit_permissions(identity)
        }
        # fixes issue with permissions not propagating down to template
        search_options["overrides"]["permissions"] = extra_context["permissions"]

    def form_config(self, *, form_config, api_record, identity, **kwargs):
        self.fill_permissions(
            api_record._record if api_record else None, form_config, identity
        )

    def get_record_permissions(
        self, actions: dict[str, str], service, identity, record, **kwargs
    ):
        """Helper for generating (default) record action permissions."""

        ret = {}
        for action_name, mapped_to in actions.items():
            try:
                can_perform = service.check_permission(
                    identity, action_name, record=record or {}, **kwargs
                )
            except Exception:  # noqa
                can_perform = False
            ret[f"can_{mapped_to}"] = can_perform
        return ret

    def fill_permissions(self, record, extra_context, identity, **kwargs):
        from ..resource import RecordsUIResource

        if not isinstance(self.resource, RecordsUIResource):
            return

        # prefill permissions with False (drafts do not have some of those)
        extra_context["permissions"] = {
            f"can_{mapped_to}": False
            for _action, mapped_to in current_oarepo_ui.record_actions.items()
        }
        extra_context["permissions"].update(
            self.get_record_permissions(
                (
                    current_oarepo_ui.draft_actions
                    if record and getattr(record, "is_draft", False)
                    else current_oarepo_ui.record_actions
                ),
                self.resource.api_service,
                identity,
                record,
                **kwargs,
            )
        )
