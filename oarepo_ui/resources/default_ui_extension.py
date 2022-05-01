from oarepo_ui.ext_api import OARepoUIExtensionConfig


class DefaultUIExtensionConfig(OARepoUIExtensionConfig):
    imported_templates = {
        'oarepo_ui': 'oarepo_ui/macros.html.jinja2',
        'oarepo_ui_components': 'oarepo_ui/components/components.html.jinja2',
        'authority': 'oarepo_ui/components/authority.html.jinja2'
    }
