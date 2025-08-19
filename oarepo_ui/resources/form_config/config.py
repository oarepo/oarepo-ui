#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Form config UI endpoint config."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..base import UIResourceConfig

if TYPE_CHECKING:
    from collections.abc import Mapping


# TODO: is this needed?
class FormConfigResourceConfig(UIResourceConfig):
    """Configuration for the form configuration resource."""

    application_id = "Default"

    def form_config(self, **kwargs: Any) -> dict[str, Any]:
        """Get the react form configuration.

        :param kwargs: Additional configuration options.
        :return: Dictionary with form configuration for React forms.
        """
        """Get the react form configuration."""
        return dict(
            **kwargs,
        )

    components = ()
    routes: Mapping[str, str] = {}
