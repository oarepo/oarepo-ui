#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Form config UI endpoint resource."""

from __future__ import annotations

from typing import Any

from flask import g
from flask_resources import (
    route,
)

from ..base import UIComponentsResource, pass_route_args
from .config import FormConfigResourceConfig


class FormConfigResource(UIComponentsResource[FormConfigResourceConfig]):
    """A resource for form configuration."""

    def create_url_rules(self) -> list[dict[str, Any]]:
        """Create the URL rules for the record resource."""
        return [
            route("GET", "", self.form_config),
        ]

    def _get_form_config(self, **kwargs: Any) -> dict[str, Any]:
        """Get the form configuration for React forms.

        :param kwargs: Additional configuration options.
        :return: Dictionary with form configuration.
        """
        return self.config.form_config(**kwargs)

    @pass_route_args()
    def form_config(self) -> dict[str, Any]:
        """Return form configuration.

        This is a view method that retrieves the form configuration by running
        the necessary components.
        """
        form_config = self._get_form_config()
        self.run_components(
            "form_config",
            form_config=form_config,
            identity=g.identity,
        )
        return form_config
