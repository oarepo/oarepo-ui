from flask import Blueprint, jsonify

from oarepo_ui.proxy import current_oarepo_ui

blueprint = Blueprint(
    'oarepo_ui',
    __name__,
    url_prefix='/oarepo',
)


@blueprint.route('/indices/')
def list_indices():
    indices = {
        index: current_oarepo_ui.get_index(index)
        for index in current_oarepo_ui.indices
    }
    return jsonify(indices)


@blueprint.route('/indices/<index>')
def get_index(index=None):
    return jsonify(
        current_oarepo_ui.get_index(index)
    )
