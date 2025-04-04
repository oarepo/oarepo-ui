from flask import current_app
from werkzeug.local import LocalProxy

current_oarepo_ui = LocalProxy(lambda: current_app.extensions["oarepo_ui"])
"""Proxy to the oarepo_ui state."""

current_ui_overrides = LocalProxy(
    lambda: current_app.extensions["oarepo_ui"].ui_overrides
)
"""Proxy to get the current ui_overrides."""

current_optional_manifest = LocalProxy(lambda: current_oarepo_ui.optional_manifest)
"""Proxy to current optional webpack manifest."""
