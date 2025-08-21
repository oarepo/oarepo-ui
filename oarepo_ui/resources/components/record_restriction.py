#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Component exposing record restriction settings to the UI form configuration.

Reads related configuration values and provides them to the frontend to control
whether and when records can be restricted after publication.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any, override

from flask import current_app

from ..records.config import RecordsUIResourceConfig
from .base import UIResourceComponent


class RecordRestrictionComponent[T: RecordsUIResourceConfig = RecordsUIResourceConfig](UIResourceComponent[T]):
    """Populate form configuration with record restriction settings."""

    @override
    def form_config(self, *, form_config: dict[str, Any], **kwargs: Any) -> None:
        """Set grace period and allowance flags for record restriction.

        Inserts the number of days for the restriction grace period as an
        integer and whether restricting a record after the grace period is
        allowed.

        :param form_config: Form configuration dictionary to mutate in-place.
        """
        form_config["recordRestrictionGracePeriod"] = current_app.config.get(
            "RDM_RECORDS_RESTRICTION_GRACE_PERIOD", timedelta(days=30)
        ).days

        form_config["allowRecordRestriction"] = current_app.config.get(
            "RDM_RECORDS_ALLOW_RESTRICTION_AFTER_GRACE_PERIOD", False
        )
