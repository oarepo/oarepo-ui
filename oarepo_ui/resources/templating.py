import functools
from pathlib import Path
import re
from typing import Dict
from flask.globals import _app_ctx_stack
from flask.templating import _render
from jinja2 import nodes, pass_context
from jinja2.ext import Extension

from oarepo_ui.proxies import current_oarepo_ui
from oarepo_ui.utils import n2w
from jinja2.utils import htmlsafe_json_dumps
import markupsafe

from frozendict import frozendict
from lxml import etree
from jinja2 import Environment
from jinja2.loaders import BaseLoader
from jinja2.runtime import Context
from jinja2.environment import TemplateModule
from invenio_records.dictutils import dict_lookup
from markupsafe import escape
import json


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
            extensions=[FieldExtension, ValueExtension],
        )
        self._cached_jinja_env.filters["id"] = id_filter
        self._load_macros(self._cached_jinja_env)
        return self._cached_jinja_env

    def get_template(self, layout: str, layout_blocks: frozendict):
        if self.app.debug or self.app.config.get("TEMPLATES_AUTO_RELOAD"):
            return self._get_template(layout, layout_blocks)
        else:
            return self._get_cached_template(layout, layout_blocks)

    def _get_template(self, layout: str, layout_blocks: frozendict):
        assembled_template = ['{%% extends "%s" %%}' % layout]
        for blk_name, blk in layout_blocks.items():
            assembled_template.append(
                '{%% block %s %%}{%% include "%s" %%}{%% endblock %%}' % (blk_name, blk)
            )
        assembled_template = "\n".join(assembled_template)

        return self.jinja_env.from_string(assembled_template)

    _get_cached_template = functools.lru_cache(_get_template)

    def _load_macros(self, env):
        macros = {}
        templates = [
            x for x in env.loader.list_templates() if "oarepo_ui/components/" in x
        ]
        # sort templates - take theme ones (semantic-ui/oarepo_ui/components/...) first,
        # then sort by file name - 999-aaa will be processed before 000-aaa
        templates.sort(
            key=lambda x: (
                not x[0].startswith("oarepo_ui/components/"),
                Path(x).name,
            )
        )
        for template_name in reversed(templates):
            loaded = env.get_or_select_template(template_name)
            for symbol in dir(loaded.module):
                if symbol.startswith("render_"):
                    macros[symbol] = loaded
        env.globals["oarepo_ui_macros"] = macros

    def get_macros(self):
        return self.jinja_env.globals["oarepo_ui_macros"]


from jinja2_simple_tags import StandaloneTag


class LookupError(Exception):
    def __init__(self, message) -> None:
        super().__init__(message)
        self.message = message


class RenderMixin:
    def lookup_data(self, field_path, ui, layout):
        if not field_path:
            return ui or self.context["ui"], layout or self.context["layout"]
        if ui is None or layout is None:
            if ui is None:
                try:
                    ui = dict_lookup(self.context["ui"], field_path)
                except KeyError:
                    raise LookupError("")
            if layout is None:
                fp = []
                for fld in field_path.split("."):
                    fp.append("children")
                    fp.append(fld)
                try:
                    layout = dict_lookup(self.context["layout"], fp)
                except KeyError:
                    raise LookupError(
                        '<div style="color: red">'
                        f'ERROR: layout not found for "{escape(field_path)}", '
                        f"layout is <pre>{escape(json.dumps(self.context['layout'], ensure_ascii=False, indent=4))}</pre>"
                        f"data is <pre>{escape(json.dumps(self.context['data'], ensure_ascii=False, indent=4))}</pre>"
                        "</div>"
                    )
        return ui, layout

    def get_value_component(self, ctx, layout, component):
        value_component = None
        if not component:
            component = layout.get(ctx["component_key"])
            if not component:
                component = "value"
        if isinstance(component, str):

            def replace_non_variable_signs(x):
                return f"__{ord(x.group())}__"

            component = re.sub("\W", replace_non_variable_signs, component)
            render_macro = "render_" + component
            component_module = ctx["oarepo_ui_macros"].get(render_macro)
            if component_module:
                value_component = getattr(
                    TemplateModule(component_module, ctx), render_macro, None
                )
        else:
            value_component = component
        if not value_component:
            raise LookupError(
                '<div style="color: red">'
                f'ERROR: no component registered with code "{escape(component)}"'
                "</div>"
            )
        return value_component


class FieldExtension(RenderMixin, StandaloneTag):
    tags = {"field"}

    def render(self, field_path=None, component=None, label_key=None):
        try:
            ui, layout = self.lookup_data(field_path, None, None)
        except LookupError as e:
            return e.message
        # render content
        ctx = self.context.derived({"ui": ui, "layout": layout})
        try:
            value_component = self.get_value_component(ctx, layout, component)
        except LookupError as e:
            return e.message
        content = ctx.call(value_component, ui)
        return self.get_value_component(ctx, layout, "field")(
            label_key or layout.get("label"), content
        )


class ValueExtension(RenderMixin, StandaloneTag):
    tags = {"value"}

    def render(self, field_path=None, component=None, **kwargs):
        try:
            ui, layout = self.lookup_data(
                field_path, kwargs.pop("ui", None), kwargs.pop("layout", None)
            )
        except LookupError as e:
            return e.message
        # render content
        ctx = self.context.derived({**kwargs, "ui": ui, "layout": layout})
        try:
            value_component = self.get_value_component(ctx, layout, component)
        except LookupError as e:
            return e.message
        return ctx.call(value_component, ui)


def id_filter(x):
    return id(x)
