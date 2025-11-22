# OARepo UI

User interface components and templating system for [Invenio](https://inveniosoftware.org/) framework.

## Overview

This package extends Invenio with comprehensive UI capabilities:

- JinjaX-based static template rendering system
- React JS integration for dynamic search interfaces
- Pluggable UI resource components
- Content negotiation and export decorators
- Configurable permission-based UI actions
- Built-in components for common UI patterns
- Template override system for customization

## Installation

```bash
pip install oarepo-ui
```

### Requirements

- Python 3.13+
- Invenio 14.x
- oarepo-runtime >= 2.0.0
- jinjax >= 0.60

## Key Features

### 1. JinjaX Template System

**Source:** [`oarepo_ui/templating/catalog.py`](oarepo_ui/templating/catalog.py), [`oarepo_ui/ext.py`](oarepo_ui/ext.py)

OARepo builds its static UI pages on top of the [JinjaX library](https://jinjax.scaletti.dev/), providing a component-based templating system with reusable UI elements.

#### Component Specification

Define templates in your configuration:

```python
templates = {
    "detail": "DetailPage",
    "search": "SearchPage"
}
```

Components accept `metadata`, `ui`, and `layout` parameters by default. Define parameters using JinjaX syntax:

```jinja
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

#### Nested Components

Create reusable component hierarchies:

```jinja
{#def metadata, ui, layout #}
<h1 style="margin-bottom: 1em">{{ metadata.title }}</h1>
<dl class="ui very basic table">
<Field label="accessibility">{{metadata.accessibility}}</Field>
```

#### Component Namespacing

Use dot notation to organize components in subdirectories:

```python
templates = {
    "detail": "myrepo.DetailPage",
    "search": "myrepo.SearchPage"
}
```

Components are loaded from `templates/myrepo/DetailPage.jinja`.

**Built-in Components:**

The library provides pre-built components in the `templates/` folder:

- `ClipboardCopyButton.jinja` - Copy-to-clipboard functionality
- `IdentifierBadge.jinja` - Display identifier badges (DOI, etc.)
- `IdentifiersAndLinks.jinja` - Render multiple identifiers
- `Multilingual.jinja` - Multilingual field display
- `RecordExport.jinja` - Export functionality
- `RecordSharing.jinja` - Social sharing buttons
- `RecordVersions.jinja` - Version navigation
- `SearchLink.jinja` - Search result links

### 2. UI Resource System

**Source:** [`oarepo_ui/resources/base.py`](oarepo_ui/resources/base.py), [`oarepo_ui/resources/records/`](oarepo_ui/resources/records/)

Pluggable resource system for building UI endpoints with component-based architecture.

```python
from oarepo_ui.resources.base import UIResourceConfig, UIComponentsResource

class MyUIResourceConfig(UIResourceConfig):
    blueprint_name = "my_records"
    url_prefix = "/records"
    template_folder = "templates"
    
    components = (
        PermissionsComponent,
        BabelComponent,
        FilesComponent,
    )

class MyUIResource(UIComponentsResource):
    def __init__(self, config):
        super().__init__(config)
```

**Key capabilities:**

- Blueprint-based routing
- Component lifecycle management
- Template folder resolution
- Content negotiation support
- Error handler registration

### 3. UI Resource Components

**Source:** [`oarepo_ui/resources/components/`](oarepo_ui/resources/components/)

Reusable components for common UI functionality:

#### Base Component

```python
from oarepo_ui.resources.components import UIResourceComponent

class MyComponent(UIResourceComponent):
    def before_ui_detail(self, *, id, identity, record, extra_context, **kwargs):
        # Add data to template context
        extra_context["custom_data"] = self.compute_data(record)
```

#### Built-in Components

**PermissionsComponent** ([`permissions.py`](oarepo_ui/resources/components/permissions.py))

- Computes UI permission flags for record actions
- Maps API permissions to UI visibility controls

**BabelComponent** ([`babel.py`](oarepo_ui/resources/components/babel.py))

- Provides locale information to templates
- Integrates with Flask-Babel

**FilesComponent** ([`files.py`](oarepo_ui/resources/components/files.py))

- Adds file metadata to record context
- Handles file listing and access

**CustomFieldsComponent** ([`custom_fields.py`](oarepo_ui/resources/components/custom_fields.py))

- Exposes custom field vocabularies to UI
- Provides vocabulary term resolution

**AllowedHtmlTagsComponent** ([`bleach.py`](oarepo_ui/resources/components/bleach.py))

- Configures HTML sanitization rules
- Provides safe HTML rendering configuration

**MultilingualFieldLanguagesComponent** ([`multilingual_field_languages.py`](oarepo_ui/resources/components/multilingual_field_languages.py))

- Adds available language options for multilingual fields

**RecordRestrictionComponent** ([`record_restriction.py`](oarepo_ui/resources/components/record_restriction.py))

- Computes record access restriction status

**FilesLockedComponent** ([`files_locked.py`](oarepo_ui/resources/components/files_locked.py))

- Determines if record files are locked for editing

**FilesQuotaAndTransferComponent** ([`files_quota.py`](oarepo_ui/resources/components/files_quota.py))

- Provides file quota and transfer information

**EmptyRecordAccessComponent** ([`access_empty_record.py`](oarepo_ui/resources/components/access_empty_record.py))

- Ensures empty record structures have proper access data

### 4. Resource Decorators

**Source:** [`oarepo_ui/resources/decorators/`](oarepo_ui/resources/decorators/)

#### Content Negotiation

```python
from oarepo_ui.resources.decorators import content_negotiation

@content_negotiation(
    default="text/html",
    supported=["text/html", "application/json"]
)
def detail_view(self, id, identity, **kwargs):
    # Automatically handles Accept header routing
    pass
```

#### Signposting

FAIR Signposting implementation for machine-readable links:

```python
from oarepo_ui.resources.decorators import signposting

@signposting
def landing_page(self, id, identity, record, **kwargs):
    # Adds Link headers and linkset endpoints
    pass
```

**Supported relation types:**

- `author` - Author identifiers
- `cite-as` - Persistent identifier (DOI)
- `describedby` - Metadata formats
- `item` - File contents
- `license` - License URIs
- `type` - Resource type (schema.org)

#### Record/Draft Passthrough

```python
from oarepo_ui.resources.decorators import pass_record, pass_draft

@pass_record
def detail_view(self, id, identity, record, **kwargs):
    # `record` parameter automatically populated
    pass

@pass_draft
def edit_view(self, id, identity, draft, **kwargs):
    # `draft` parameter automatically populated
    pass
```

### 5. React Search UI Integration

**Source:** [`oarepo_ui/resources/records/config.py`](oarepo_ui/resources/records/config.py), [`oarepo_ui/resources/records/resource.py`](oarepo_ui/resources/records/resource.py), webpack assets

Integration with [Invenio-Search-UI](https://github.com/inveniosoftware/invenio-search-ui) for dynamic search interfaces. The system provides embedded React apps within Jinja-rendered pages rather than full single-page applications.

#### Template Setup

```jinja
{%- extends config.BASE_TEMPLATE %}

{%- block javascript %}
    {{ super() }}
    {# imports oarepo-ui JS libraries #}
    {{ webpack['oarepo_ui.js'] }}
    {# boots Invenio-Search-UI search app #}
    {{ webpack['oarepo_ui_search.js'] }}
{%- endblock %}

<div class="ui container">
  {# DOM root element for Search UI #}
  <div data-invenio-search-config='{{ search_app_oarepo_config(app_id="oarepo-search") | tojson }}'></div>
</div>
```

#### Blueprint Configuration

```python
from functools import partial
from flask import Blueprint, render_template, current_app, g
from oarepo_runtime import current_runtime

def create_blueprint(app):
    """Blueprint for search routes."""
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
    # Get the model's service configuration
    model = current_runtime.models.get("your_model_name")
    api_config = model.service_config
    
    return {
        "search_app_oarepo_config": partial(
            # Use the config's search_app_config method from RecordsUIResourceConfig
            your_ui_resource_config.search_app_config,
            identity=g.identity,
            api_config=api_config,
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

#### Search Configuration

In your `invenio.cfg`:

```python
from flask_babel import lazy_gettext as _

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

### 6. UI Component Override System

**Source:** [`oarepo_ui/overrides/components.py`](oarepo_ui/overrides/components.py), [`oarepo_ui/config.py`](oarepo_ui/config.py)

Dynamic override system for JavaScript React components:

```python
from oarepo_ui.overrides import UIComponent, UIComponentOverride

# Register custom result list item component
component = UIComponent(
    name="MyResultItem",
    module="my_app.components",
    import_mode="lazy"
)

override = UIComponentOverride(
    endpoint="search",
    component=component
)

# Add to configuration
OAREPO_UI_OVERRIDES = {override}
```

**Result List Item Registration:**

```python
from oarepo_ui.proxies import current_oarepo_ui

current_oarepo_ui.register_result_list_item(
    schema="https://example.com/schemas/record-1.0.0.json",
    component=my_component
)
```

### 7. Permission-Based UI Actions

**Source:** [`oarepo_ui/config.py`](oarepo_ui/config.py)

Configure which actions are available in the UI:

```python
# Record actions (published records)
OAREPO_UI_RECORD_ACTIONS = {
    "search",
    "create",
    "read",
    "update",
    "delete",
    "read_files",
    "update_files",
    "read_deleted_files",
    "edit",
    "new_version",
    "manage",
    "review",
    "view",
    "manage_files",
    "manage_record_access",
}

# Draft action mapping
OAREPO_UI_DRAFT_ACTIONS = {
    "read_draft": "read",
    "update_draft": "update",
    "delete_draft": "delete",
    "draft_read_files": "read_files",
    "draft_update_files": "update_files",
    "draft_read_deleted_files": "read_deleted_files",
    "manage": "manage",
    "manage_files": "manage_files",
    "manage_record_access": "manage_record_access",
}
```

### 8. Multilingual Field Support

**Source:** [`oarepo_ui/config.py`](oarepo_ui/config.py)

Configure supported languages for multilingual fields:

```python
from flask_babel import lazy_gettext as _

OAREPO_UI_MULTILINGUAL_FIELD_LANGUAGES = [
    {"text": _("English"), "value": "en"},
    {"text": _("Czech"), "value": "cs"},
]
```

### 9. Template Filters and Globals

**Source:** [`oarepo_ui/templating/filters.py`](oarepo_ui/templating/filters.py), [`oarepo_ui/config.py`](oarepo_ui/config.py)

Custom Jinja filters and global functions:

```python
OAREPO_UI_JINJAX_FILTERS = {
    "compact_number": "invenio_app_rdm.records_ui.views.filters:compact_number",
    "localize_number": "invenio_app_rdm.records_ui.views.filters:localize_number",
    "truncate_number": "invenio_app_rdm.records_ui.views.filters:truncate_number",
    "as_dict": "oarepo_ui.templating.filters:as_dict",
    "ui_value": "oarepo_ui.templating.filters:ui_value",
}

OAREPO_UI_JINJAX_GLOBALS = {
    "ui_value": "oarepo_ui.templating.filters:ui_value",
    "as_array": "oarepo_ui.templating.filters:as_array",
    "value": "oarepo_ui.templating.filters:value",
    "as_dict": "oarepo_ui.templating.filters:as_dict",
}
```

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/oarepo/oarepo-ui.git
cd oarepo-ui

./run.sh venv
```

### Running Tests

```bash
./run.sh test
```

## Entry Points

The package registers several Invenio entry points:

```python
[project.entry-points."invenio_base.apps"]
oarepo_ui = "oarepo_ui.ext:OARepoUIExtension"

[project.entry-points."oarepo_ui.extensions"]
default = "oarepo_ui._components:DefaultUIExtensionConfig"

[project.entry-points."invenio_i18n.translations"]
oarepo_ui_messages = "oarepo_ui"

[project.entry-points."invenio_assets.webpack"]
oarepo_ui_theme = "oarepo_ui.theme.webpack:theme"

[project.entry-points."invenio_base.blueprints"]
oarepo_ui = "oarepo_ui.views:create_blueprint"

[project.entry-points."invenio_base.finalize_app"]
oarepo_ui = "oarepo_ui.views:finalize_app"
```

## License

Copyright (c) 2022-2025 CESNET z.s.p.o.

OARepo UI is free software; you can redistribute it and/or modify it under the terms of the MIT License. See [LICENSE](LICENSE) file for more details.

## Links

- Documentation: <https://github.com/oarepo/oarepo-ui>
- PyPI: <https://pypi.org/project/oarepo-ui/>
- Issues: <https://github.com/oarepo/oarepo-ui/issues>
- OARepo Project: <https://github.com/oarepo>

## Acknowledgments

This project builds upon [Invenio Framework](https://inveniosoftware.org/) and is developed as part of the OARepo ecosystem.
