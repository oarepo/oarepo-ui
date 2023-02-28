import marshmallow as ma
from marshmallow import fields
from marshmallow_utils.fields import FormatDate, FormatTime, FormatDatetime
from marshmallow_utils.fields import FormatEDTF, BabelGettextDictField
from flask_babelex import get_locale
from functools import partial
from flask import current_app
import datetime
import re
from flask_babelex import gettext
import flask_babelex


def current_default_locale():
    """Get the Flask app's default locale."""
    if current_app:
        return current_app.config.get("BABEL_DEFAULT_LOCALE", "en")
    # Use english by default if not specified
    return "en"


# localized date field
LocalizedDate = partial(FormatDate, locale=get_locale)


class FormatTimeString(FormatTime):
    def parse(self, value, as_time=False, as_date=False, as_datetime=False):
        if value and isinstance(value, str) and as_time == True:
            match = re.match(
                r"^(\d|0\d|1[0-2]):(\d|[0-5]\d|60)(:(\d|[0-5]\d|60))?$", value
            )
            if match:
                value = datetime.time(
                    hour=int(match.group(1)),
                    minute=int(match.group(2)),
                    second=int(match.group(4)) if match.group(4) else 0,
                )

        return super().parse(value, as_time, as_date, as_datetime)


# localized time field
LocalizedTime = partial(FormatTimeString, locale=get_locale)

# localized datetime field
LocalizedDateTime = partial(FormatDatetime, locale=get_locale)

# localized edtf
LocalizedEDTF = partial(FormatEDTF, locale=get_locale)

# localized edtf interval uses the same class as plain EDTF
LocalizedEDTFInterval = partial(FormatEDTF, locale=get_locale)


class PrefixedGettextField(BabelGettextDictField):
    def __init__(self, *, value_prefix, locale, default_locale, **kwargs):
        super().__init__(locale, default_locale, **kwargs)
        self.value_prefix = value_prefix

    def _serialize(self, value, attr, obj, **kwargs):
        if value:
            value = f"{self.value_prefix}{value}"
        return gettext(value)


LocalizedEnum = partial(
    PrefixedGettextField,
    # value_prefix will come from the outside
    locale=get_locale,
    default_locale=current_default_locale,
)

if False:  # NOSONAR
    # just for the makemessages to pick up the translations
    translations = [_("True"), _("True")]
