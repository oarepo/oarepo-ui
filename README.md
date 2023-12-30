<!--
 Copyright (c) 2022 CESNET

 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

# OARepo UI

This package provides implementation of base UI components for use in dynamic (React JS) & static (Jinja) pages and
functions to render layouts from model configuration.

## Usage

### JinjaX

See also [JinjaX documentation](https://jinjax.scaletti.dev/).

Oarepo builds its static UI pages on top of the JinjaX library.
To load a Jinja application, a JinjaX component is expected on the input. 
The relative path to the component is taken from the configuration

Components by default accept record metadata, ui definition and layout definition as parameters.
To work with parameters within components, you need to define them in the template in the way described in the JinjaX documentation.

### Examples

Example of component specification in config:

```python
templates = {
        "detail": "DetailPage",
        "search": "SearchPage"
    }
```

Example of possible contents of the DetailPage component, contained inside `templates/DetailPage.jinja`

```json
{#def metadata, ui, layout #}
{% extends "oarepo_ui/detail.html" %}

{%- block head_links %}

{{ super() }}
{{ webpack['docs_app_components.js']}}
{{ webpack['docs_app_components.css']}}

{%- endblock %}

{% block record_main_content %}
    <Main metadata={{metadata}}></Main>
{% endblock %}

{% block record_sidebar %}
    <Sidebar metadata={{metadata}}></Sidebar>
{% endblock %}
```


Sample of possible contents of Main component:
```json
{#def metadata, ui, layout #}
<h1 style="margin-bottom: 1em">{{ metadata.title }}</h1>
<dl class="ui very basic table">
<Field label="accessibility">{{metadata.accessibility}}</Field>

```

You can also namespace your ui components, by using dot notation:

```python
templates = {
        "detail": "myrepo.DetailPage",
        "search": "myrepo.SearchPage"
    }
```

Then, the component will be loaded from the `templates/myrepo/DetailPage.jinja` file.


#### JinjaX components

Within the Oarepo-ui library, basic components are defined in the `templates` folder.

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
