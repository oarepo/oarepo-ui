from flask.globals import _app_ctx_stack
from flask.templating import _render
from jinja2 import nodes, pass_context
from jinja2.ext import Extension

from oarepo_ui.proxies import current_oarepo_ui


class ImportMacros(Extension):
    """
    Parse an {% import_macros %} tag. Takes configuration
    from current_oarepo_ui.macros and loads them into the globals.

    Passes all the globals to the loaded macros (preventing caching,
    but the modules will have access to, for example, url_for
    """
    tags = {"import_macros"}

    def parse(self, parser):
        lineno = parser.stream.expect("name:import_macros").lineno
        for alias, tmpl in current_oarepo_ui.imported_templates.items():
            loaded = self.environment.get_or_select_template(tmpl)
            self.environment.globals[alias] = loaded.make_module({**self.environment.globals}, True, {})
        return nodes.Output([]).set_lineno(lineno)


def is_list(value):
    return isinstance(value, (list, tuple))


def get_item(value, item, default=None):
    return value.get(item, default)


@pass_context
def get_component(context, value):
    value = (value or '').replace('-', '_')
    try:
        return current_oarepo_ui.get_jinja_component(value)
    except KeyError:
        return current_oarepo_ui.get_jinja_component('unknown')


def render_template_with_macros(template_name_or_list, **context):
    """adapted from render_template, just an overlay with ImportMacros extension"""
    app, env = get_macro_environment(context)
    return _render(
        env.get_or_select_template(template_name_or_list),
        context,
        app,
    )


def get_macro_environment(context):
    app = _app_ctx_stack.top.app
    app.update_template_context(context)
    env = app.jinja_env.overlay(extensions=[ImportMacros])
    env.tests.update({'list': is_list})
    env.filters.update({'item': get_item})
    env.globals.update({
        'get_component': get_component
    })
    return app, env
