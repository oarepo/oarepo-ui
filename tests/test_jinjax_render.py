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


def test_jinjax_render(app):
    del current_oarepo_ui.catalog.component_paths
    ret = current_oarepo_ui.catalog.render("TestSelectTemplate")

    assert "B template" in ret
    assert "blahblah" in ret
