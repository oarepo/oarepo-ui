from oarepo_ui.ext_api import OARepoUIExtensionConfig


class DefaultUIExtensionConfig(OARepoUIExtensionConfig):
    imported_templates = {
        'oarepo_ui': 'oarepo_ui/macros.html.jinja2',
        'oarepo_ui_components': 'oarepo_ui/components/components.html.jinja2',

        # structural
        'oarepo_ui_grid': 'oarepo_ui/components/structural/grid.html.jinja2',
        'oarepo_ui_row': 'oarepo_ui/components/structural/row.html.jinja2',
        'oarepo_ui_column': 'oarepo_ui/components/structural/column.html.jinja2',

        # basic
        'oarepo_ui_icon': 'oarepo_ui/components/basic/icon.html.jinja2',
        'oarepo_ui_list': 'oarepo_ui/components/basic/list.html.jinja2',
        'oarepo_ui_raw': 'oarepo_ui/components/basic/raw.html.jinja2',
        'oarepo_ui_button': 'oarepo_ui/components/basic/button.html.jinja2',
        'oarepo_ui_separator': 'oarepo_ui/components/basic/separator.html.jinja2',
        'divided_row': 'oarepo_ui/components/structural/divided-row.html.jinja2',
        'oarepo_ui_container': 'oarepo_ui/components/basic/container.html.jinja2',
        'oarepo_ui_header': 'oarepo_ui/components/basic/header.html.jinja2',
        'oarepo_ui_label': 'oarepo_ui/components/basic/label.html.jinja2',
        'oarepo_ui_link': 'oarepo_ui/components/basic/link.html.jinja2',
        'oarepo_ui_segment': 'oarepo_ui/components/basic/segment.html.jinja2',
        'oarepo_ui_span': 'oarepo_ui/components/basic/span.html.jinja2',

        # specific to nr schema
        'authority': 'oarepo_ui/components/authority.html.jinja2'
    }
