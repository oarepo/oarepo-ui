#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
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
from .form_config import FormConfigResource, FormConfigResourceConfig
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
    "FormConfigResource",
    "FormConfigResourceConfig",
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
