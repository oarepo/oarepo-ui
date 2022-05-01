from flask import Flask
from flask.globals import _app_ctx_stack
from flask.templating import _render
from jinja2 import nodes, pass_context
from jinja2.ext import Extension

app = Flask("programmatic_import", template_folder='./templates')

imported_templates = {
    'test': 'test.html'
}



with app.app_context():
    print(macros_render_template("main.html", name='test'))
