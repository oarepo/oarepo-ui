from oarepo_ui.proxy import current_oarepo_ui


class ContextMixin:
    config = None

    def get_context(self, params, *path):
        context = params.get('oarepo_context', None)
        if not context:
            context = 'api'

        context = current_oarepo_ui.get_context(context)
        if not context:
            return None
        if self.config.model not in context:
            return None
        c = context[self.config.model]

        # look up the path
        for p in path:
            if p not in c:
                return None
            c = c[p]
        return c
