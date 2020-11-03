from flask import Blueprint, jsonify
from flask.views import MethodView

from oarepo_ui.proxy import current_oarepo_ui


class EndpointOptionsView(MethodView):
    name = '{0}_options'

    def __init__(self, endpoint):
        self.endpoint = endpoint

    def options(self):
        ret = {}
        index_name = self.endpoint['config'].get('search_index')
        if index_name:
            index = current_oarepo_ui.facets[index_name]
            ret['facets'] = current_oarepo_ui._translate_facets(index.get('aggs', {}), index_name=index_name,
                                                                index=index)
            ret['filters'] = current_oarepo_ui._translate_filters(index.get('filters', {}), index_name=index_name,
                                                                  index=index)
        return jsonify(ret)


def create_blueprint_from_app(app):
    with app.app_context():
        blueprint = Blueprint(
            'oarepo_ui',
            __name__,
            url_prefix='/',
        )

        for endpoint in current_oarepo_ui.endpoints:
            blueprint.add_url_rule(
                endpoint['list_route'],
                view_func=EndpointOptionsView.as_view(
                    name=EndpointOptionsView.name.format(endpoint['name']),
                    endpoint=endpoint
                ),
                methods=['OPTIONS'],
            )

        return blueprint
#
#
# @blueprint.route('/oarepo_ui/indices/')
# def list_indices():
#     indices = {
#         index: current_oarepo_ui.get_index(index)
#         for index in current_oarepo_ui.indices
#     }
#     return jsonify(indices)
#
#
# @blueprint.route('/oarepo_ui/indices/<index>')
# def get_index(index=None):
#     return jsonify(
#         current_oarepo_ui.get_index(index)
#     )
