#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI module initialization.

This module provides the main entry point for the OARepo UI extension,
which adds user interface components and functionality to OARepo repositories.
"""

from __future__ import annotations

from .ext import OARepoUIExtension

__version__ = "6.0.0dev4"

__all__ = [
    "OARepoUIExtension",
    "__version__",
]
