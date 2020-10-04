from flask_babelex import gettext
from invenio_records_rest.utils import allow_all


def default_translator(key, **kwargs):
    return gettext(key)


def default_permission_factory(**kwargs):
    return allow_all()
