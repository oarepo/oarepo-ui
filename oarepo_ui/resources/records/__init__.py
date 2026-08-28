# SPDX-FileCopyrightText: 2025 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""UI endpoint for records."""

from __future__ import annotations

from .config import RecordsUIResourceConfig
from .resource import RecordsUIResource

__all__ = ("RecordsUIResource", "RecordsUIResourceConfig")
