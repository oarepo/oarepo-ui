from .base import UIResourceComponent
from typing import Dict
from flask_principal import Identity


class FilesLockedComponent(UIResourceComponent):
    """Add files locked to form config, to be able to use the same logic as in RDM"""

    def before_ui_create(
        self,
        *,
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
        data: Dict,
        identity: Identity,
        form_config: Dict,
        args: Dict,
        view_args: Dict,
        ui_links: Dict,
        extra_context: Dict,
        **kwargs,
    ) -> None:
        form_config["filesLocked"] = True
