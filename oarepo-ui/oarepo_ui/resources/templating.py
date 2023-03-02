import functools
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


class TemplateRegistry:
    def __init__(self, app, ui_state) -> None:
        self.app = app
        self.ui_state = ui_state
        self._cached_jinja_env = None

    @property
    def jinja_env(self):
        if self._cached_jinja_env and not self.app.debug:
            return self._cached_jinja_env

        original_env = self.app.jinja_env

        self._cached_jinja_env = self.app.jinja_env.overlay(
            # extensions=[ImportMacros],
        )
        self._load_macros(self._cached_jinja_env)
        return self._cached_jinja_env

    def get_template(self, layout: str, layout_blocks: frozendict):
        if True or self.app.debug:
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
        templates = env.loader.list_templates()
        for template_name in templates:
            if template_name.startswith("oarepo_ui/components/"):
                loaded = env.get_or_select_template(template_name)
                loaded_symbols = [
                    k for k in dir(loaded.module) if not k.startswith("_")
                ]
                loaded_module = loaded.make_module({**env.globals}, True, {})
                for symbol in loaded_symbols:
                    env.globals[symbol] = getattr(loaded_module, symbol)
