#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""UI endpoint for records."""

from __future__ import annotations

from .config import RecordsUIResourceConfig
from .resource import RecordsUIResource

__all__ = ("RecordsUIResource", "RecordsUIResourceConfig")
