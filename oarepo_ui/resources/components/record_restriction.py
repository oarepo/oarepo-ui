from datetime import timedelta

from flask import current_app

from .base import UIResourceComponent


class RecordRestrictionComponent(UIResourceComponent):
    def form_config(self, *, form_config, **kwargs):
        form_config["recordRestrictionGracePeriod"] = current_app.config.get(
            "RDM_RECORDS_RESTRICTION_GRACE_PERIOD", timedelta(days=30)
        ).days

        form_config["allowRecordRestriction"] = current_app.config.get(
            "RDM_RECORDS_ALLOW_RESTRICTION_AFTER_GRACE_PERIOD", False
        )
