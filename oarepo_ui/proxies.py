from flask import current_app
from werkzeug.local import LocalProxy

current_oarepo_ui = LocalProxy(lambda: current_app.extensions["oarepo_ui"])
"""Proxy to the oarepo_ui state."""
