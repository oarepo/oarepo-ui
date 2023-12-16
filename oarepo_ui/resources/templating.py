class TemplateRegistry:
    def __init__(self, app, ui_state) -> None:
        self.app = app
        self.ui_state = ui_state
        self._cached_jinja_env = None

    @property
    def jinja_env(self):
        if (
            self._cached_jinja_env
            and not self.app.debug
            and not self.app.config.get("TEMPLATES_AUTO_RELOAD")
        ):
            return self._cached_jinja_env

        self._cached_jinja_env = self.app.jinja_env.overlay(
            loader=self.app.jinja_env.loader,
            extensions=[],
        )
        self._cached_jinja_env.filters["id"] = id_filter
        self._cached_jinja_env.filters["to_dict"] = to_dict
        return self._cached_jinja_env


def id_filter(x):
    return id(x)


# TODO: do we still need this ?
def to_dict(value=None):
    if value:
        return value
