from blinker import Namespace

_signals = Namespace()

before_facet_options = _signals.signal('before-facet-options')
"""Signal is sent before facet options are returned.

   :param source: view instance
   :param index: Facets index instance ({aggs: ..., filters: ...})
   :param request: request instance
   :param view_args: view args
   :param view_kwargs: view kwargs
"""
