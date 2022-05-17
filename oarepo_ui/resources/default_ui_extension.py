from oarepo_ui.ext_api import OARepoUIExtensionConfig


class DefaultUIExtensionConfig(OARepoUIExtensionConfig):
    imported_templates = {
        'oarepo_ui': 'oarepo_ui/macros.html.jinja2',
        'oarepo_ui_components': 'oarepo_ui/components/components.html.jinja2',
        'oarepo_ui_grid': 'oarepo_ui/components/structural/grid.html.jinja2',
        'oarepo_ui_row': 'oarepo_ui/components/structural/row.html.jinja2',
        'oarepo_ui_column': 'oarepo_ui/components/structural/column.html.jinja2',
        'authority': 'oarepo_ui/components/authority.html.jinja2'
    }
