#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Template page UI endpoint."""

from __future__ import annotations

from functools import partial
from typing import TYPE_CHECKING, Any

from flask import g
from flask_resources import (
    route,
)

from oarepo_ui.proxies import current_oarepo_ui

from ..base import UIResource, pass_route_args

if TYPE_CHECKING:
    from werkzeug import Response

    from .config import TemplatePageUIResourceConfig


class TemplatePageUIResource(UIResource):
    """A resource for rendering jinja template pages with a specific configuration."""

    def create_url_rules(self) -> list[dict[str, Any]]:
        """Create the URL rules for the record resource."""
        self.config: TemplatePageUIResourceConfig  # pyright: ignore[reportIncompatibleVariableOverride] better type

        pages_config = self.config.pages
        routes = []
        for page_url_path, page_template_name in pages_config.items():
            url_prefix: str = self.config.url_prefix
            route_url_with_prefix = url_prefix.rstrip("/") + "/" + page_url_path.lstrip("/")

            handler = getattr(self, f"render_{page_template_name}", None) or partial(
                self.render, page=page_template_name
            )
            if not hasattr(handler, "__name__"):
                handler.__name__ = self.render.__name__  # type: ignore[union-attr]
            if not hasattr(handler, "__self__"):
                handler.__self__ = self  # type: ignore[union-attr]

            routes.append(
                route("GET", route_url_with_prefix, handler),
            )
        return routes

    @pass_route_args()
    def render(self, page: str, **kwargs: Any) -> str | Response:
        """Render a named jinja template page."""
        extra_context: dict[str, Any] = {}

        self.run_components(
            "before_render",
            identity=g.identity,
            ui_config=self.config,
            extra_context=extra_context,
            page=page,
        )

        return current_oarepo_ui.catalog.render(
            page,
            **kwargs,
            ui_config=self.config,
            ui_resource=self,
            extra_context=extra_context,
        )
