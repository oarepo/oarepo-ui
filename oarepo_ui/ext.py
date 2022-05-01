from functools import cached_property
from typing import List

from importlib_metadata import entry_points
from jinja2.environment import TemplateModule

from oarepo_ui.ext_api import OARepoUIExtensionConfig
from oarepo_ui.resources.templating import get_macro_environment


class OARepoUIState:
    def __init__(self, app):
        self.app = app

    @cached_property
    def ui_extensions(self) -> List[OARepoUIExtensionConfig]:
        return [x.load()(app=self.app) for x in entry_points().select(group='oarepo_ui.extensions')]

    @cached_property
    def default_components(self):
        ret = []
        for extension in self.ui_extensions:
            ret.extend(getattr(extension, 'components'))
        return ret

    @cached_property
    def imported_templates(self):
        """returns a dictionary of alias -> template name"""
        ret = {}
        for extension in self.ui_extensions:
            ret.update(getattr(extension, 'imported_templates'))
        return ret

    def get_jinja_component(self, component_name):
        return self.jinja_components[component_name]

    @cached_property
    def jinja_components(self):
        _, env = get_macro_environment({})
        ret = {}
        for name, val in env.globals.items():
            if not isinstance(val, TemplateModule):
                continue
            for kk in dir(val):
                if kk.startswith('render_'):
                    component_name = kk[len('render_'):]
                    ret[component_name] = getattr(val, kk)
        return ret


class OARepoUIExtension:
    def __init__(self, app=None):
        if app:
            self.init_app(app)

    def init_app(self, app):
        self.init_config(app)
        app.extensions["oarepo_ui"] = OARepoUIState(app)

    def init_config(self, app):
        pass
