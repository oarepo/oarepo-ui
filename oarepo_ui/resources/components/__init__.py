#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI resource components module.

This module provides various UI resource components for OARepo,
including components for access control, file handling, community management,
permissions, and data processing functionality.
"""

from __future__ import annotations

from .access_empty_record import EmptyRecordAccessComponent
from .babel import BabelComponent
from .base import UIResourceComponent
from .bleach import AllowedHtmlTagsComponent
from .files import FilesComponent
from .files_locked import FilesLockedComponent
from .permissions import PermissionsComponent
from .record_restriction import RecordRestrictionComponent

__all__ = (
    "AllowedHtmlTagsComponent",
    "BabelComponent",
    "EmptyRecordAccessComponent",
    "FilesComponent",
    "FilesLockedComponent",
    "PermissionsComponent",
    "RecordRestrictionComponent",
    "UIResourceComponent",
)
