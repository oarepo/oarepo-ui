from .base import UIResourceComponent
from .babel import BabelComponent
from .bleach import AllowedHtmlTagsComponent
from .files import FilesComponent
from .permissions import PermissionsComponent
from .communities import AllowedCommunitiesComponent

__all__ = (
    "UIResourceComponent",
    "PermissionsComponent",
    "AllowedHtmlTagsComponent",
    "BabelComponent",
    "FilesComponent",
    "AllowedCommunitiesComponent"
)