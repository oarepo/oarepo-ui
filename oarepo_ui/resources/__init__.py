from .components.babel import BabelComponent
from .components.permissions import PermissionsComponent
from .config import RecordsUIResourceConfig, UIResourceConfig
from .resource import RecordsUIResource, UIResource

__all__ = (
    "UIResource",
    "RecordsUIResource",
    "UIResourceConfig",
    "RecordsUIResourceConfig",
    "PermissionsComponent",
    "BabelComponent",
)
