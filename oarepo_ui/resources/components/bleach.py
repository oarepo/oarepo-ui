from flask import current_app
from invenio_config.default import ALLOWED_HTML_ATTRS, ALLOWED_HTML_TAGS

from .base import UIResourceComponent


class AllowedHtmlTagsComponent(UIResourceComponent):
    def form_config(self, *, form_config, **kwargs):
        form_config["allowedHtmlTags"] = current_app.config.get(
            "ALLOWED_HTML_TAGS", ALLOWED_HTML_TAGS
        )

        form_config["allowedHtmlAttrs"] = current_app.config.get(
            "ALLOWED_HTML_ATTRS", ALLOWED_HTML_ATTRS
        )
