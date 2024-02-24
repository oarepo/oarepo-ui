from oarepo_ui.resources.templating.data import FieldData


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
    x = scalar(x)
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


def scalar(value):
    if isinstance(value, FieldData):
        if value._is_empty:
            return None
        return value.value
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
