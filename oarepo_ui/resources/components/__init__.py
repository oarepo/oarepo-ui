# SPDX-FileCopyrightText: 2025 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

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
from .custom_fields import CustomFieldsComponent
from .files import FilesComponent
from .files_locked import FilesLockedComponent
from .files_quota import FilesQuotaAndTransferComponent
from .multilingual_field_languages import MultilingualFieldLanguagesComponent
from .permissions import PermissionsComponent
from .record_restriction import RecordRestrictionComponent

__all__ = (
    "AllowedHtmlTagsComponent",
    "BabelComponent",
    "CustomFieldsComponent",
    "EmptyRecordAccessComponent",
    "FilesComponent",
    "FilesLockedComponent",
    "FilesQuotaAndTransferComponent",
    "MultilingualFieldLanguagesComponent",
    "PermissionsComponent",
    "RecordRestrictionComponent",
    "UIResourceComponent",
)
