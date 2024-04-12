from functools import wraps
from flask import request


def pass_is_preview(f):
    """Decorate a view to check if it's a preview."""

    @wraps(f)
    def wrapper(self, *args, **kwargs):
        kwargs["is_preview"] = request.args.get("preview") == "1"
        return f(self, *args, **kwargs)

    return wrapper
