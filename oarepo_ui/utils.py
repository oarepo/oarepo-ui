def partial_format(s, **kwargs):
    if s is None:
        return s
    for k, v in kwargs.items():
        s = s.replace('{%s}' % k, v)
    return s


def get_oarepo_attr(filter):
    ret = getattr(filter, '_oarepo_ui', None)
    if ret is None:
        n = {}
        setattr(filter, '_oarepo_ui', n)
        return n
    else:
        return ret
