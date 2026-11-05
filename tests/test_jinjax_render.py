# SPDX-FileCopyrightText: 2025 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

from __future__ import annotations

from oarepo_ui.proxies import current_oarepo_ui


def test_jinjax_render(app):
    del current_oarepo_ui.catalog.component_paths
    ret = current_oarepo_ui.catalog.render("TestSelectTemplate")

    assert "B template" in ret
    assert "blahblah" in ret
