from jinja2 import Environment
from jinja2.loaders import BaseLoader


class RegistryLoader(BaseLoader):
    def __init__(self, parent_loader) -> None:
        super().__init__()
        self.parent_loader = parent_loader

    def get_source(self, environment: "Environment", template: str):
        return self.parent_loader.get_source(environment=environment, template=template)

    def list_templates(self):
        return self.parent_loader.list_templates()

    def load(
        self,
        environment: "Environment",
        name: str,
        globals=None,
    ):
        return self.parent_loader.load(
            environment=environment, name=name, globals=globals
        )


def to_dict(value=None):
    if value:
        return value


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
            loader=RegistryLoader(self.app.jinja_env.loader),
            extensions=[],
        )
        self._cached_jinja_env.filters["id"] = id_filter
        self._cached_jinja_env.filters["to_dict"] = to_dict
        return self._cached_jinja_env


def id_filter(x):
    return id(x)


def to_dict(value=None):
    if value:
        return value
