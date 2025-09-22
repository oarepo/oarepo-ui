#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations

from oarepo_ui.proxies import current_oarepo_ui


def test_component_paths(app):
    component_paths = current_oarepo_ui.catalog.component_paths
    assert "components.IField" in component_paths
    assert "IField" in component_paths
