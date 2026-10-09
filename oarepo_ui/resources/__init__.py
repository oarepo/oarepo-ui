# SPDX-FileCopyrightText: 2025 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""OARepo UI resources module.

This module provides resource classes and configurations for OARepo UI,
including UI-specific resource handlers, components, and configuration
classes for managing user interface interactions and data rendering.
"""

from __future__ import annotations

from .base import (
    UIComponentsResource,
    UIResource,
    UIResourceConfig,
)
from .components import (
    AllowedHtmlTagsComponent,
    BabelComponent,
    CustomFieldsComponent,
    EmptyRecordAccessComponent,
    FilesComponent,
    FilesLockedComponent,
    PermissionsComponent,
    RecordRestrictionComponent,
    UIResourceComponent,
)
from .records import (
    RecordsUIResource,
    RecordsUIResourceConfig,
)
from .template_pages import TemplatePageUIResource, TemplatePageUIResourceConfig

__all__ = (
    "AllowedHtmlTagsComponent",
    "BabelComponent",
    "CustomFieldsComponent",
    "EmptyRecordAccessComponent",
    "FilesComponent",
    "FilesLockedComponent",
    "PermissionsComponent",
    "RecordRestrictionComponent",
    "RecordsUIResource",
    "RecordsUIResourceConfig",
    "TemplatePageUIResource",
    "TemplatePageUIResourceConfig",
    "UIComponentsResource",
    "UIResource",
    "UIResourceComponent",
    "UIResourceConfig",
)
