#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI components module.

This module provides UI component classes for OARepo UI overrides system,
including the UIComponent class for defining React component specifications
and predefined components for common UI functionality like disabled states
and search facets with version toggles.
"""

from __future__ import annotations

import dataclasses
import enum
import json
from typing import Any, override


class UIComponentImportMode(enum.Enum):
    """Import modes for UI components.

    It is either named (import {name} from '{path}') or default (import '{name}')
    """

    DEFAULT = "default"
    NAMED = "named"


@dataclasses.dataclass
class UIComponent:
    """Represents a UI component specification used to override existing UI components."""

    import_name: str
    """The name of the component."""

    import_path: str
    """JS module path where the component is imported from."""

    import_mode: UIComponentImportMode = UIComponentImportMode.NAMED
    """The mode of import, either UIComponentImportMode.DEFAULT or UIComponentImportMode.NAMED."""

    props: dict[str, Any] | None = None
    """Additional key-value string properties used to parametrize
    the component before registering it to overrides store.
    """

    @property
    def name(self) -> str:
        """Name of the component."""
        if self.props:
            return f"{self.import_name}WithProps"

        return self.import_name

    @property
    def import_statement(self) -> str:
        """JS import statement string to import the component."""
        import_name = (
            self.import_name if self.import_mode == UIComponentImportMode.DEFAULT else f"{{ {self.import_name} }}"
        )

        return f"import {import_name} from '{self.import_path}';"

    @property
    def parametrize_statement(self) -> str | None:
        """JS statement to parametrize the component with props."""
        if self.props:
            js_props = ", ".join(f"{key}: {json.dumps(value)}" for key, value in self.props.items())
            return f"const {self.name} = parametrize({self.import_name}, {{ {js_props} }});"
        return None

    @override
    def __repr__(self):
        return f"UIComponent({self.import_name} <{self.import_path}>, {self.import_mode} import)>)"


@dataclasses.dataclass
class UIComponentOverride:
    """Represents an override for a UI component.

    An instance of this class should be placed to OAREPO_UI_OVERRIDES configuration
    (set of UIComponentOverride instances).

    To minimize bundle size, Javascript overrides are packaged in a way that they apply
    just to the selected endpoint, not to the whole repository. That's why you have to
    register the components together with the endpoint they belong to.
    """

    endpoint: str
    """Flask Blueprint endpoint name."""
    overridable_id: str
    """Unique overridable component ID for react-overridable."""
    component: UIComponent
    """UI component module description."""

    @override
    def __eq__(self, other: object) -> bool:
        return isinstance(other, UIComponentOverride) and (
            self.endpoint == other.endpoint and self.overridable_id == other.overridable_id
        )

    @override
    def __hash__(self) -> int:
        return hash(self.endpoint) ^ hash(self.overridable_id)


DisabledComponent = UIComponent("Disabled", "@js/oarepo_ui/components/Disabled")

FacetsWithVersionsToggle = UIComponent(
    "SearchAppFacets",
    "@js/oarepo_ui/search/SearchAppFacets",
    props={"allVersionsToggle": True},
)
