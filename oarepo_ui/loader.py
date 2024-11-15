from invenio_app.helpers import ThemeJinjaLoader

from oarepo_ui.proxies import current_oarepo_ui


class OverridableThemeJinjaLoader(ThemeJinjaLoader):
    """Overridable theme template loader.

    This loader acts as a wrapper for any type of Jinja loader. Before doing a
    template lookup, the loader consults the ui_overrides configuration to determine
    which template should be used.
    """

    def __init__(self, app, loader):
        """Initialize loader.
        """
        super().__init__(app, loader)

    def load(self, environment, name, globals=None):
        name = current_oarepo_ui.lookup_jinja_component(name)

        return super().load(environment, name, globals)
