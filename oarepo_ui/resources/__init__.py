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
from .components.babel import BabelComponent
from .components.permissions import PermissionsComponent
from .form_config import FormConfigResource, FormConfigResourceConfig
from .records import (
    RecordsUIResource,
    RecordsUIResourceConfig,
)
from .template_pages import TemplatePageUIResource, TemplatePageUIResourceConfig

__all__ = (
    "BabelComponent",
    "FormConfigResource",
    "FormConfigResourceConfig",
    "PermissionsComponent",
    "RecordsUIResource",
    "RecordsUIResourceConfig",
    "TemplatePageUIResource",
    "TemplatePageUIResourceConfig",
    "UIComponentsResource",
    "UIResource",
    "UIResourceConfig",
)
