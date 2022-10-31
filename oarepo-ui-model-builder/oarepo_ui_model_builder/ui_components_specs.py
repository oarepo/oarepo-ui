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
    name = 'grid'
    members = ['rows', 'columns']
    jinja_template = 'oarepo_ui/components/grid.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Grid'

class RowComponent:
    name = 'row'
    members = ['columns']
    jinja_template = 'oarepo_ui/components/row.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Row'

class ColumnComponent:
    name = 'column'
    members = ['items']
    jinja_template = 'oarepo_ui/components/column.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Column'


# Basic components
class IconComponent:
    name = 'icon'
    members = []
    jinja_template = 'oarepo_ui/components/icon.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Icon'

class ListComponent:
    name = 'list'
    members = []
    jinja_template = 'oarepo_ui/components/list.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/List'

class RawComponent:
    name = 'raw'
    members = ['children']
    jinja_template = 'oarepo_ui/components/raw.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Raw'

class ButtonComponent:
    name = 'button'
    members = ['children']
    jinja_template = 'oarepo_ui/components/button.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Button'

class SeparatorComponent:
    name = 'separator'
    members = []
    jinja_template = 'oarepo_ui/components/separator.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Separator'

class DividedRowComponent:
    name = 'divided-row'
    members = ['items']
    jinja_template = 'oarepo_ui/components/divided-row.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/DividedRow'

class ContainerComponent:
    name = 'container'
    members = ['children']
    jinja_template = 'oarepo_ui/components/container.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Container'

class HeaderComponent:
    name = 'header'
    members = ['children']
    jinja_template = 'oarepo_ui/components/header.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Header'

class LabelComponent:
    name = 'label'
    members = ['children']
    jinja_template = 'oarepo_ui/components/label.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Label'

class LinkComponent:
    name = 'link'
    members = ['children']
    jinja_template = 'oarepo_ui/components/link.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Link'

class SegmentComponent:
    name = 'segment'
    members = ['children']
    jinja_template = 'oarepo_ui/components/segment.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Segment'

class SpanComponent:
    name = 'span'
    members = ['children']
    jinja_template = 'oarepo_ui/components/span.html.jinja2'
    react_component = '@uijs/oarepo_ui/ui_components/Span'
