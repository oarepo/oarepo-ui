# SPDX-FileCopyrightText: 2025-2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Template page UI endpoint."""

from __future__ import annotations

from functools import partial
from typing import TYPE_CHECKING, Any

from flask import g
from flask_resources import (
    route,
)

from oarepo_ui.proxies import current_oarepo_ui

from ..base import UIResource
from ..decorators import pass_route_args
from .config import TemplatePageUIResourceConfig

if TYPE_CHECKING:
    from werkzeug import Response


class TemplatePageUIResource(UIResource[TemplatePageUIResourceConfig]):
    """A resource for rendering jinja template pages with a specific configuration."""

    def create_url_rules(self) -> list[dict[str, Any]]:
        """Create the URL rules for the record resource."""
        pages_config = self.config.pages
        routes = []
        for page_url_path, page_template_name in pages_config.items():
            handler = getattr(self, f"render_{page_template_name}", None)
            if handler is None:
                # flask_resources' route() reads ``__name__`` and ``__self__`` off the view,
                # which a partial does not have, so they are copied from the bound method
                page_handler: Any = partial(self.render, page=page_template_name)
                page_handler.__name__ = self.render.__name__
                page_handler.__self__ = self
                handler = page_handler

            routes.append(route("GET", page_url_path, handler))
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
