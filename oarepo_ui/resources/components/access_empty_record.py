#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#

"""Component setting default access values for newly created empty records.

This module defines a UI resource component that ensures empty record data
contain default public access settings for both record and files.
"""

from __future__ import annotations

from typing import Any, override

from ..records.config import RecordsUIResourceConfig
from .base import UIResourceComponent


class EmptyRecordAccessComponent[T: RecordsUIResourceConfig = RecordsUIResourceConfig](UIResourceComponent[T]):
    """Prefills empty record data with default public access settings.

    The component ensures that the required "access" structure exists and sets
    both record and files access to "public". This helps the UI initialize forms
    consistently for new records.
    """

    @override
    def empty_record(self, *, empty_data: dict, **_kwargs: Any) -> None:
        """Add default access permissions to an empty record.

        :param empty_data: empty record data
        :param kwargs: additional keyword arguments (unused)
        """
        empty_data.setdefault("access", {})
        empty_data["access"]["files"] = "public"
        empty_data["access"]["record"] = "public"
