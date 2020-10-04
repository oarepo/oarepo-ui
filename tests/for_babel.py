from flask_babelex import gettext

def _just_for_babel():
    gettext('category')
    gettext('my.own.facet.label')
    gettext('my.own.facet.category')
    gettext('my.own.filter.category')
    gettext('my.own.filter.label')
    gettext('oarepo.facets.default-facets.category.label')
    gettext('oarepo.facets.default-filters.category.label')
