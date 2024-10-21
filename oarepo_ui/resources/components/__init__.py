from .babel import BabelComponent
from .base import UIResourceComponent
from .bleach import AllowedHtmlTagsComponent
from .communities import AllowedCommunitiesComponent
from .files import FilesComponent
from .permissions import PermissionsComponent

__all__ = (
    "UIResourceComponent",
    "PermissionsComponent",
    "AllowedHtmlTagsComponent",
    "BabelComponent",
    "FilesComponent",
    "AllowedCommunitiesComponent",
)
