# SPDX-FileCopyrightText: 2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

from __future__ import annotations

import pytest
from flask import current_app
from jinja2 import ChoiceLoader, DictLoader

TEMPLATES = ["oarepo_ui/deposit_create.html", "oarepo_ui/deposit_edit.html"]

# invenio-app-rdm v14.0.6 / maint-14.1.x ``records/deposit.html``: the css block is wrapped in an ``if``,
# which Jinja ignores for block definitions, so the theme link is always rendered.
UPSTREAM_V14_DEPOSIT = """
{%- extends "stub_base.html" %}
{%- if community and community.theme and community.theme.enabled %}
  {%- block css %}
  {{ super() }}
  <link rel="stylesheet" type="text/css" href="{{ invenio_url_for(
      'invenio_communities.community_theme_css_config',
      pid_value=community.slug, revision=community.revision_id) }}">
  {%- endblock %}
{%- endif %}
"""
STUB_BASE = (
    "{% block css %}<base-css/>{% endblock %}{% block page_body %}{% endblock %}{% block javascript %}{% endblock %}"
)


@pytest.fixture
def stub_upstream_deposit(app):
    env = app.jinja_env
    original = env.loader
    env.loader = ChoiceLoader(
        [
            DictLoader({"invenio_app_rdm/records/deposit.html": UPSTREAM_V14_DEPOSIT, "stub_base.html": STUB_BASE}),
            original,
        ]
    )
    env.cache.clear()
    try:
        yield
    finally:
        env.loader = original
        env.cache.clear()


def _render_css(template_name, **context):
    template = current_app.jinja_env.get_template(template_name)
    ctx = template.new_context({"config": current_app.config, **context})
    for block_name, block in current_app.jinja_env.get_template("invenio_app_rdm/records/deposit.html").blocks.items():
        ctx.blocks.setdefault(block_name, []).append(block)
    for block_name, block in current_app.jinja_env.get_template("stub_base.html").blocks.items():
        ctx.blocks.setdefault(block_name, []).append(block)
    return "".join(ctx.blocks["css"][0](ctx))


@pytest.mark.parametrize("template_name", TEMPLATES)
def test_deposit_css_without_community_has_no_theme_link(app, stub_upstream_deposit, template_name):
    with app.test_request_context():
        css = _render_css(template_name, community=None)
    assert "<base-css/>" in css
    assert "community-theme-" not in css


@pytest.mark.parametrize("template_name", TEMPLATES)
def test_deposit_css_without_enabled_theme_has_no_theme_link(app, stub_upstream_deposit, template_name):
    community = {"slug": "c", "revision_id": 2, "theme": {"enabled": False}}
    with app.test_request_context():
        css = _render_css(template_name, community=community)
    assert "community-theme-" not in css


@pytest.mark.parametrize("template_name", TEMPLATES)
def test_deposit_css_with_enabled_theme_links_theme(app, stub_upstream_deposit, template_name):
    community = {"slug": "branded", "revision_id": 3, "theme": {"enabled": True}}
    with app.test_request_context():
        css = _render_css(template_name, community=community)
    assert css.count("community-theme-") == 1
    assert "/communities/branded/community-theme-3.css" in css
