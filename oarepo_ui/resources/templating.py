from flask.globals import _app_ctx_stack
from flask.templating import _render
from jinja2 import nodes, pass_context
from jinja2.ext import Extension

from oarepo_ui.proxies import current_oarepo_ui
from oarepo_ui.utils import n2w
from jinja2.utils import htmlsafe_json_dumps
import markupsafe


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
def get_component(context, component_name):
    f"""
    Looks up a component by name in the jinja context and returns a pair 
    (component_accepts_array_of_values, jinja_compiled_macro). 
    
    If there is a context macro with name "{component_name}_array", returns that the component
    accepts array, that is (True, jinja_compiled_macro)
    
    If there is a context macro with name "component_name", returns (False, jinja_compiled_macro)
    
    If no macro has been found, returns the special "unknown" macro that displays "undefined component"
    message.
    
    :param context: jinja context
    :param component_name:   name of the component to resolve
    :return: tuple (accepts_array, jinja_component function)
    """
    component_name = (component_name or '').replace('-', '_')

    def resolve_component(name):
        (module_name, render_name) = current_oarepo_ui.get_jinja_component(name)
        return getattr(context.environment.globals[module_name], render_name)

    try:
        return True, resolve_component(component_name + '_array')
    except KeyError:
        pass

    try:
        return False, resolve_component(component_name)
    except KeyError:
        pass

    return True, resolve_component('unknown')


def get_data(layout_data_definition, data, record):
    def _rec(path, current_data):
        if isinstance(current_data, (list, tuple)):
            for val in current_data:
                yield from _rec(path, val)
            return

        if not path:
            yield current_data
            return

        first = path[0]
        path = path[1:]
        if isinstance(current_data, dict) and first in current_data:
                yield from _rec(path, current_data[first])
            # else do not yield a value
        # else do not yield a value

    if not layout_data_definition:
        return data
    return list(_rec(layout_data_definition.split('.'), data))


def get_props(layout_props, className, style):
    if not layout_props:
        layout_props = {}
    else:
        layout_props = {**layout_props}
    if className:
        if 'className' not in layout_props:
            layout_props['className'] = className
        else:
            layout_props['className'] += ' ' + className
    if style:
        if 'style' not in layout_props:
            layout_props['style'] = style
        else:
            if not layout_props['style'].strip().endswith(';'):
                layout_props['style'] += '; '
            layout_props['style'] += style
    layout_props.pop('data', None)  # remove already processed stuff from the props
    layout_props.pop('component', None)
    return layout_props


def merge_class_name(class_name, merged):
    if not class_name:
        return merged
    return class_name + ' ' + merged


SIZES = ['mini', 'tiny', 'small', 'medium', 'large', 'big', 'huge', 'massive']


def add_size(value, *sizes):
    split_val = [x for x in (value or '').split() if x]
    for s in sizes:
        if not s:
            continue
        for v in split_val:
            if v in SIZES:
                return value
        split_val.append(s)
        break
    return ' '.join(split_val)


def update(dictionary, **kwargs):
    return {
        **dictionary,
        **kwargs
    }


def as_attributes(*dictionaries):
    if len(dictionaries) == 1:
        dictionary = dictionaries[0]
    else:
        dictionary = {}
        for d in dictionaries:
            dictionary.update(d)

    ret = []
    for k, v in (dictionary or {}).items():
        if k in (
                'dataField'
        ):
            continue
        v = htmlsafe_json_dumps(v)
        if v[0] != '"':
            v = v.replace('"', '&quot;')
            v = f'"{v}"'
        ret.append(f'{k}={v}')
    return markupsafe.Markup(' '.join(ret))


def as_array(value):
    if not value:
        return []
    if isinstance(value, (list, tuple)):
        return value
    return [value]


@pass_context
def render_macro_to_array(context, macro_name, layout=None, data=None, record=None, items=None, is_array=None):
    if not data:
        return ''

    macro = context[macro_name]
    ret = []

    def _render(data):
        if items is not None:
            for it in items:
                yield macro(layout=it, data=data, record=record)
        else:
            if not is_array:
                data = [data]
            if not isinstance(data, (tuple, list)):
                data = [data]
            for d in data:
                yield macro(layout=layout, data=d, record=record)

    for rendered_d in _render(data):
        if rendered_d:
            rendered_d = rendered_d.strip()
        if rendered_d:
            ret.append(markupsafe.Markup(rendered_d))
    return ret


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
    env.filters.update({
        'item': get_item,
        'remove_property': lambda val, prop: {k: v for k, v in val.items() if k != prop},
        'update': update,
        'add_size': add_size
    })
    env.globals.update({
        'get_component': get_component,
        'get_data': get_data,
        'get_props': get_props,
        'merge_class_name': merge_class_name,
        'number_to_word': n2w,
        'as_attributes': as_attributes,
        'as_array': as_array,
        'render_macro_to_array': render_macro_to_array
    })
    return app, env
