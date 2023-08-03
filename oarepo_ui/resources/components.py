from flask import current_app

from invenio_i18n.ext import current_i18n
from oarepo_ui.proxies import current_oarepo_ui

from invenio_records_resources.services.records.components import ServiceComponent


class BabelFormConfigComponent(ServiceComponent):
    def form_config(
        self, *, form_config, resource, record, view_args, identity, **kwargs
    ):
        conf = current_app.config
        languages_config = {"all": [], "common": []}
        for l in current_i18n.get_locales():
            # Avoid duplicate language entries
            if l.language in [lang["value"] for lang in languages_config["all"]]: continue

            option = {"value": l.language, "text": l.get_display_name()}
            languages_config["all"].append(option)

            if l.language in current_oarepo_ui.common_languages:
                languages_config["common"].append(option)

        babel_config = dict(
            current_locale=str(current_i18n.locale),
            locales=languages_config["all"],
            default_locale=conf.get("BABEL_DEFAULT_LOCALE", "en"),
            languages=languages_config,
        )
        form_config.update(babel_config)
