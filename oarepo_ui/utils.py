def partial_format(s, **kwargs):
    for k, v in kwargs.items():
        s = s.replace('{%s}' % k, v)
    return s
