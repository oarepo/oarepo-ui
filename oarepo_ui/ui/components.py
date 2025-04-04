import json
from typing import Dict, Optional


class UIComponent:
    """Represents a UI component specification used to override existing UI components.

    Attributes:
        import_name (str):
            The name of the component.
        import_path (str):
            JS module path where the component is imported from.
        import_mode (str):
            The mode of import, either 'default' or 'named'.
        props (dict, optional):
            Additional key-value string properties used to parametrize
            the component before registering it to overrides store.
    """

    def __init__(
        self,
        import_name: str,
        import_path: str,
        import_mode: str = "named",
        props: Optional[Dict[str, any]] = None,
    ):
        """Initialize a UIComponentOverride instance."""
        self.import_name = import_name
        self.import_path = import_path
        self.import_mode = import_mode
        self.props = props

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
            self.import_name
            if self.import_mode == "default"
            else f"{{ {self.import_name} }}"
        )

        return f"import {import_name} from '{self.import_path}';"

    @property
    def parametrize_statement(self) -> str | None:
        """JS statement to parametrize the component with props."""
        if self.props:
            js_props = ", ".join(
                f"{key}: {json.dumps(value)}" for key, value in self.props.items()
            )
            return f"const {self.name} = parametrize({self.import_name}, {{ {js_props} }});"

    def __repr__(self):
        return f"UIComponent({self.import_name} <{self.import_path}>, {self.import_mode} import)>)"


DisabledComponent = UIComponent("Disabled", "@js/oarepo_ui/components/Disabled")

FacetsWithVersionsToggle = UIComponent(
    "SearchAppFacets",
    "@js/oarepo_ui/search/SearchAppFacets",
    props={"allVersionsToggle": True},
)
