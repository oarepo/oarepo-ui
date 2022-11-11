<!--
 Copyright (c) 2022 CESNET

 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

# OARepo UI

This package provides implementation of base UI components for use in dynamic (React JS) & static (Jinja) pages and
functions to render layouts from model configuration.

## Usage

### React

To render a custom layout in a React app (e. g. records search result page), this package provides the `useLayout` hook and an entrypoint
for bootstrapping [Search UI](https://github.com/inveniosoftware/invenio-search-ui) app. In your `search.html` template, you can use it like this:

```jinja
{%- extends config.BASE_TEMPLATE %}

{%- block javascript %}
    {{ super() }}
    {# imports oarepo-ui JS libraries to be used on page #}
    {{ webpack['oarepo_ui.js'] }}
    {# boots Invenio-Search-UI based search app, with dynamic UI widgets provided by oarepo-ui #}
    {{ webpack['oarepo_ui_search.js'] }}
{%- endblock %}

{# ... #}

<div class="ui container">
  {# provides a DOM root element for the Search UI to be mounted into #}
  <div data-invenio-search-config='{{ search_app_oarepo_config(app_id="oarepo-search") | tojson }}'></div>
</div>
```

Next you will need to register an app context processor named `search_app_oarepo_config` and register it
to blueprint handling the `search.html` template route. In the context processor, you can provide your
own layout configuration for different parts of UI to be used by `oarepo-ui` libs to generate user interface widgets.

```python
def create_blueprint(app):
    """Blueprint for the routes and resources."""
    blueprint = Blueprint(
        "your-app",
        __name__,
        template_folder="templates",
        static_folder="static",
    )

    blueprint.add_url_rule("/", view_func=search)
    blueprint.app_context_processor(search_app_context)
    return blueprint


def search():
    """Search template."""
    return render_template('your-app/search.html')

def search_app_context():
    """Search app context processor."""
    return {
        "search_app_oarepo_config": partial(
            search_app_config,
            "OAREPO_SEARCH",
            [], #current_app.config["OAREPO_FACETS"],1
            current_app.config["OAREPO_SORT_OPTIONS"],
            endpoint="/api/your-records",
            headers={"Accept": "application/json"},
            overrides={
                "layoutOptions": {
                    "listView": True,
                    "gridView": False,
                    "ResultsList": {
                        "item": {
                            "component": 'segment',
                            "children": [{
                                "component": "header",
                                "dataField": "metadata.title"
                            }]
                        }
                    }
                }
            }
        )
    }
```

In your `invenio.cfg`, customize the general search app settings:

```python
OAREPO_SEARCH = {
    "facets": [],
    "sort": ["bestmatch", "newest", "oldest", "version"],
}

OAREPO_SORT_OPTIONS = {
    "bestmatch": dict(
        title=_("Best match"),
        fields=["_score"],  # search defaults to desc on `_score` field
    ),
    "newest": dict(
        title=_("Newest"),
        fields=["-created"],
    ),
    "oldest": dict(
        title=_("Oldest"),
        fields=["created"],
    ),
    "version": dict(
        title=_("Version"),
        fields=["-versions.index"],
    ),
    "updated-desc": dict(
        title=_("Recently updated"),
        fields=["-updated"],
    ),
    "updated-asc": dict(
        title=_("Least recently updated"),
        fields=["updated"],
    ),
}
```
