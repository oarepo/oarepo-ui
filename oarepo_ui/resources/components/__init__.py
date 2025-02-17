from .access_empty_record import EmptyRecordAccessComponent
from .babel import BabelComponent
from .base import UIResourceComponent
from .bleach import AllowedHtmlTagsComponent
from .communities import AllowedCommunitiesComponent
from .files import FilesComponent
from .files_locked import FilesLockedComponent
from .permissions import PermissionsComponent
from .record_restriction import RecordRestrictionComponent

__all__ = (
    "UIResourceComponent",
    "PermissionsComponent",
    "AllowedHtmlTagsComponent",
    "BabelComponent",
    "FilesComponent",
    "AllowedCommunitiesComponent",
    "FilesLockedComponent",
    "RecordRestrictionComponent",
    "EmptyRecordAccessComponent",
)
