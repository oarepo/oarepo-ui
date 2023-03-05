from oarepo_ui.resources.templating import TemplateRegistry
from flask import render_template_string
import re


def strip_ws(x):
    return re.sub(r"\s+", "", x)


def test_process_template(app):
    ui = app.extensions["oarepo_ui"]
    env = ui.templates.jinja_env
    template = env.from_string('<h1>{% value "metadata.title" %}</h1>')
    rendered = template.render(
        ui={"metadata": {"title": "Hello world!"}},
        layout={
            "children": {"metadata": {"children": {"title": {"detail": "fulltext"}}}}
        },
        component_key="detail",
    )
    assert strip_ws(rendered) == strip_ws("""<h1>Hello world!</h1>""")
