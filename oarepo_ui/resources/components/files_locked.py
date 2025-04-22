from typing import Dict

from flask_principal import Identity

from .base import UIResourceComponent


class FilesLockedComponent(UIResourceComponent):
    """Add files locked to form config, to be able to use the same logic as in RDM"""

    def before_ui_create(
        self,
        *,
        record: Dict = None,
        data: Dict,
        identity: Identity,
        form_config: Dict,
        args: Dict,
        view_args: Dict,
        ui_links: Dict,
        extra_context: Dict,
        **kwargs,
    ) -> None:
        form_config["filesLocked"] = False

    def before_ui_edit(
        self,
        *,
        record: Dict = None,
        data: Dict,
        identity: Identity,
        form_config: Dict,
        args: Dict,
        view_args: Dict,
        ui_links: Dict,
        extra_context: Dict,
        **kwargs,
    ) -> None:
        form_config["filesLocked"] = not extra_context.get("permissions", {}).get(
            "can_update_files", False
        ) or record.get("is_published", False)
