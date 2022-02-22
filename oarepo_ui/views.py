from flask import Blueprint, jsonify, request
from flask.views import MethodView

from oarepo_ui.proxy import current_oarepo_ui

blueprint = Blueprint(
    'oarepo_ui',
    __name__,
    url_prefix='/oarepo:ui',
)


@blueprint.route('/<context_id>')
def serve_ui_context(context_id):
    return jsonify(current_oarepo_ui.get_context(context_id) or {
        'error': "No context with this id"
    })
