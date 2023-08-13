import re

from flask import render_template_string  # noqa

from oarepo_ui.resources.templating import TemplateRegistry  # noqa


def strip_ws(x):
    return re.sub(r"\s+", "", x)


# def test_process_template(app):
#     ui = app.extensions["oarepo_ui"]
#     env = ui.templates.jinja_env
#     template = env.from_string('<h1>{% value "metadata.title" %}</h1>')
#     rendered = template.render(
#         ui={"metadata": {"title": "Hello world!"}},
#         layout={
#             "children": {"metadata": {"children": {"title": {"detail": "fulltext"}}}}
#         },
#         component_key="search",
#     )
#     assert strip_ws(rendered) == strip_ws("""<h1>Hello world!</h1>""")
