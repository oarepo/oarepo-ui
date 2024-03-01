from .proxies import current_oarepo_ui

def handle_user_change(app, user):
        current_oarepo_ui.reinitialize_catalog()