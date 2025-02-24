from oarepo_ui.resources.templating.data import EMPTY_FIELD_DATA, FieldData
from babel.numbers import format_compact_decimal, format_decimal
from flask import current_app


def id_filter(x):
    return id(x)


def to_dict_filter(value=None):
    if value:
        return value


def ensure_array(x):
    if isinstance(x, (list, tuple)):
        return x
    if isinstance(x, FieldData) and x._is_array:
        return x._as_array()
    if x is None:
        return []
    return [x]


def type_filter(x):
    return str(type(x))


def keys_filter(x):
    x = field_value(x)
    if not isinstance(x, dict):
        return []
    return x.keys()


def ichain(*iterables, remove_empty=False):
    """
    Chains iterables. An iterable might be a list of scalars,
    list of FieldData or single scalar/field data.
    It will call ensure_array on each item and join the resulting
    arrays.
    """
    ret = []
    for it in iterables:
        if isinstance(it, (list, tuple)):
            for x in it:
                ret.extend(ensure_array(x))
        elif it is not None:
            ret.extend(ensure_array(it))
    if remove_empty:
        ret = [
            x
            for x in ret
            if (isinstance(x, FieldData) and not x._is_empty)
            or (not isinstance(x, FieldData) and x)
        ]
    return ret


def field_value(value):
    if isinstance(value, FieldData):
        if value._is_empty:
            return None
        return value._ui_value
    return value


def field_data(value, ui=None):
    if isinstance(value, FieldData):
        return value
    return FieldData(value, ui=ui or {})


def field_get(value, key):
    key = field_value(key)
    if key is None:
        return value

    value = field_data(value)

    for key in key.split("."):
        value = getattr(value, key, EMPTY_FIELD_DATA)

    return value


def ijoin_filter(values, separator):
    ret = []
    values = ensure_array(values)
    for val in values:
        if val is None:
            continue
        if isinstance(val, FieldData) and val._is_empty:
            continue
        html_magic_method = getattr(val, "__html__", None)
        if html_magic_method:
            ret.append(html_magic_method())
        else:
            ret.append(str(val))
    return separator.join(ret)


def localize_number(value):
    """Format number according to locale value."""
    locale_value = current_app.config.get("BABEL_DEFAULT_LOCALE")
    number = int(value)
    return format_decimal(number, locale=locale_value)


def compact_number(value, max_value):
    """Format long numbers."""
    locale_value = current_app.config.get("BABEL_DEFAULT_LOCALE")
    number = int(value)
    decimals = 0

    if number > max_value:
        decimals = 2
    return format_compact_decimal(
        int(value), format_type="short", locale=locale_value, fraction_digits=decimals
    )


def truncate_number(value, max_value):
    """Make number compact if too long."""
    number = localize_number(value)
    if int(value) > max_value:
        number = compact_number(value, max_value=1_000_000)
    return number
