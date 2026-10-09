# SPDX-FileCopyrightText: 2025 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Form config UI endpoint config."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..base import UIResourceConfig

if TYPE_CHECKING:
    from collections.abc import Mapping


# TODO(mesemus): is this needed?
# > mirekys: still actively used by oarepo-requests to fetch form-config for a request type:
# https://github.com/oarepo/oarepo-requests/blob/main/oarepo_requests/ui/config.py#L64
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
