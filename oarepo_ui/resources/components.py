from flask import current_app

from invenio_i18n.ext import current_i18n

from invenio_records_resources.services.records.components import ServiceComponent


class BabelComponent(ServiceComponent):
    def form_config(
        self, *, form_config, resource, record, view_args, identity, **kwargs
    ):
        conf = current_app.config
        locales = []
        for l in current_i18n.get_locales():
            # Avoid duplicate language entries
            if l.language in [lang["value"] for lang in locales]: continue

            option = {"value": l.language, "text": l.get_display_name()}
            locales.append(option)

        form_config.setdefault("current_locale", str(current_i18n.locale))
        form_config.setdefault("default_locale", conf.get("BABEL_DEFAULT_LOCALE", "en"))
        form_config.setdefault("locales", locales)
