# no imports are allowed as these are specs only classes
#
# # Example:
#
# class ListComponent:
#
#     # the name of the component
#     name = 'list'
#
#     # types of values that the component can get as input.
#     # allowed are 'object', 'array', 'string', 'int', 'float', 'bool'
#     # To specify an array of strings, use 'array[string]'
#     value_type = ['object', 'array']
#
#     # If the component can render member components (for example, object its members),
#     # specify in which properties of oarepo:ui these member components are referenced
#     members = ['item', 'items']
#
#     # jinja template name to render the component
#     jinja_template = ''
#
#     # react stuff to render the component
#     react = TODO

# Structural components
class GridComponent:
    members = ['rows', 'columns']
    jinja_template = 'oarepo_ui/components/grid.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Grid'

class RowComponent:
    members = ['columns']
    jinja_template = 'oarepo_ui/components/row.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Row'

class ColumnComponent:
    members = ['items']
    jinja_template = 'oarepo_ui/components/column.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Column'


# Basic components
class IconComponent:
    members = []
    jinja_template = 'oarepo_ui/components/icon.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Icon'

class ListComponent:
    members = []
    jinja_template = 'oarepo_ui/components/list.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/List'

class RawComponent:
    members = ['children']
    jinja_template = 'oarepo_ui/components/raw.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Raw'

class ButtonComponent:
    members = ['children']
    jinja_template = 'oarepo_ui/components/button.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Button'

class SeparatorComponent:
    members = []
    jinja_template = 'oarepo_ui/components/separator.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Separator'

class DividedRowComponent:
    members = ['items']
    jinja_template = 'oarepo_ui/components/divided-row.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/DividedRow'

class ContainerComponent:
    members = ['children']
    jinja_template = 'oarepo_ui/components/container.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Container'

class HeaderComponent:
    members = ['children']
    jinja_template = 'oarepo_ui/components/header.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Header'

class LabelComponent:
    members = ['children']
    jinja_template = 'oarepo_ui/components/label.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Label'

class LinkComponent:
    members = ['children']
    jinja_template = 'oarepo_ui/components/link.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Link'

class SegmentComponent:
    members = ['children']
    jinja_template = 'oarepo_ui/components/segment.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Segment'

class SpanComponent:
    members = ['children']
    jinja_template = 'oarepo_ui/components/span.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Span'
