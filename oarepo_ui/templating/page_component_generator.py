#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Utility for runtime JinjaX page component generation.

When a page template is not explicitly configured, this module generates
JinjaX components on-the-fly that extend base templates for different
page types (record_detail, search, deposit_edit, deposit_create, etc.).
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Final

if TYPE_CHECKING:
    from oarepo_ui.templating.catalog import OarepoCatalog

#: Maps page types to their base template paths. {model_name} is substituted at runtime.
_TEMPLATE_MAP: Final[dict[str, str]] = {
    "record_detail": "{model_name}/record_detail.html",
    "search": "{model_name}/record_search.html",
    "deposit_edit": "{model_name}/deposit_edit.html",
    "deposit_create": "{model_name}/deposit_create.html",
    "tombstone": "tombstone.html",
    "not_found": "not_found.html",
}


def generate_page_component(
    catalog: OarepoCatalog,
    page_type: str,
    model_name: str,
    render_kwargs: dict[str, Any],
) -> str:
    """Generate a JinjaX page component that extends a base template.

    The generated component declares all keys from ``render_kwargs`` as props
    in a ``{# def #}`` block, then extends the appropriate base template.

    The component is cached in the catalog's ``_generated_components`` registry.
    Subsequent calls return the cached component name without regenerating.

    :param catalog: The OarepoCatalog instance
    :param page_type: Type of page (e.g., "record_detail", "search")
    :param model_name: Name of the model for template resolution
    :param render_kwargs: Props to declare in the ``{# def #}`` block
    :return: Component name (format: "{model_name}.{page_type}")
    """
    component_name = f"{model_name}.{page_type}"

    # Return cached component if already generated
    if component_name in catalog._generated_components:  # noqa: SLF001
        return component_name

    # Build the def block from render_kwargs
    prop_names = list(render_kwargs.keys())
    if prop_names:
        props_formatted = "\n".join(f"  {name}," for name in prop_names)
        def_block = f"{{# def\n{props_formatted}\n#}}"
    else:
        def_block = "{# def #}"

    # Build and register the component
    template_path = _TEMPLATE_MAP.get(page_type, f"{model_name}/{page_type}.html")
    base_template = template_path.format(model_name=model_name)
    source = f'{def_block}\n{{% extends "{base_template}" %}}\n'

    catalog._generated_components[component_name] = source  # noqa: SLF001

    # Invalidate component paths cache to ensure the new component is found
    if hasattr(catalog, "_component_paths"):
        del catalog._component_paths  # noqa: SLF001

    return component_name
