import os
import re
from itertools import chain
from pathlib import Path

import flask
import jinja2
from flask import current_app
from flask.globals import request
from jinjax import Catalog
from jinjax.component import Component
from jinjax.exceptions import ComponentNotFound
from jinjax.jinjax import JinjaX

DEFAULT_URL_ROOT = "/static/components/"
ALLOWED_EXTENSIONS = (".css", ".js")
DEFAULT_PREFIX = ""
DEFAULT_EXTENSION = ".jinja"
DELIMITER = "."
SLASH = "/"
PROP_ATTRS = "attrs"
PROP_CONTENT = "content"


class OarepoCatalog(Catalog):
    singleton_check = None

    def __init__(
        self,
        *,
        globals: "dict[str, t.Any] | None" = None,
        filters: "dict[str, t.Any] | None" = None,
        tests: "dict[str, t.Any] | None" = None,
        extensions: "list | None" = None,
        jinja_env: "jinja2.Environment | None" = None,
        root_url: str = DEFAULT_URL_ROOT,
        file_ext: "TFileExt" = DEFAULT_EXTENSION,
        use_cache: bool = True,
        auto_reload: bool = True,
    ) -> None:
        self.prefixes: "dict[str, jinja2.FileSystemLoader]" = {}
        self.collected_css: "list[str]" = []
        self.collected_js: "list[str]" = []
        self.file_ext = file_ext
        self.use_cache = use_cache
        self.auto_reload = auto_reload

        root_url = root_url.strip().rstrip(SLASH)
        self.root_url = f"{root_url}{SLASH}"

        # env = jinja2.Environment(undefined=jinja2.StrictUndefined)
        env = flask.templating.Environment(undefined=jinja2.Undefined, app=current_app)
        extensions = [*(extensions or []), "jinja2.ext.do", JinjaX]
        globals = globals or {}
        filters = filters or {}
        tests = tests or {}

        if jinja_env:
            env.extensions.update(jinja_env.extensions)
            globals.update(jinja_env.globals)
            filters.update(jinja_env.filters)
            tests.update(jinja_env.tests)
            jinja_env.globals["catalog"] = self
            jinja_env.filters["catalog"] = self

        globals["catalog"] = self
        filters["catalog"] = self

        for ext in extensions:
            env.add_extension(ext)
        env.globals.update(globals)
        env.filters.update(filters)
        env.tests.update(tests)
        env.extend(catalog=self)

        self.jinja_env = env

        self._cache: "dict[str, dict]" = {}

    def update_template_context(self, context: dict) -> None:
        """Update the template context with some commonly used variables.
        This injects request, session, config and g into the template
        context as well as everything template context processors want
        to inject.  Note that the as of Flask 0.6, the original values
        in the context will not be overridden if a context processor
        decides to return a value with the same key.

        :param context: the context as a dictionary that is updated in place
                        to add extra variables.
        """
        names: t.Iterable[t.Optional[str]] = (None,)

        # A template may be rendered outside a request context.
        if request:
            names = chain(names, reversed(request.blueprints))

        # The values passed to render_template take precedence. Keep a
        # copy to re-apply after all context functions.

        for name in names:
            if name in self.jinja_env.app.template_context_processors:
                for func in self.jinja_env.app.template_context_processors[name]:
                    context.update(func())

    def render(
        self,
        __name: str,
        *,
        caller: "t.Callable | None" = None,
        **kw,
    ) -> str:
        self.collected_css = []
        self.collected_js = []
        if "context" in kw:
            self.update_template_context(kw["context"])
        return self.irender(__name, caller=caller, **kw)

    def get_source(self, cname: str, file_ext: "TFileExt" = "") -> str:
        prefix, name = self._split_name(cname)
        _root_path, path = self._get_component_path(prefix, name, file_ext=file_ext)
        return Path(path).read_text()

    def _get_component_path(
        self, prefix: str, name: str, file_ext: "TFileExt" = ""
    ) -> "tuple[Path, Path]":
        name = name.replace(DELIMITER, SLASH)
        name_dot = f"{name}."
        file_ext = file_ext or self.file_ext
        root_paths = self.prefixes[prefix].searchpath

        for root_path in root_paths:
            component_path = root_path["component_path"]
            for curr_folder, _folders, files in os.walk(
                component_path, topdown=False, followlinks=True
            ):
                relfolder = os.path.relpath(curr_folder, component_path).strip(".")
                if relfolder and not name_dot.startswith(relfolder):
                    continue

                for filename in files:
                    _filepath = curr_folder + "/" + filename
                    in_searchpath = False
                    for searchpath in self.jinja_env.loader.searchpath:
                        if _filepath == searchpath["component_file"]:
                            in_searchpath = True
                            break
                    if in_searchpath:
                        prefix_pattern = re.compile(r"^\d{3}-")
                        without_prefix_filename = filename
                        if prefix_pattern.match(filename):
                            # Remove the prefix
                            without_prefix_filename = prefix_pattern.sub("", filename)
                        if relfolder:
                            filepath = f"{relfolder}/{without_prefix_filename}"
                        else:
                            filepath = without_prefix_filename
                        if filepath.startswith(name_dot) and filepath.endswith(
                            file_ext
                        ):
                            return (
                                Path(root_path["root_path"]),
                                Path(curr_folder) / filename,
                            )

        raise ComponentNotFound(
            f"Unable to find a file named {name}{file_ext} "
            f"or one following the pattern {name_dot}*{file_ext}"
        )

    def _get_from_file(
        self, *, prefix: str, name: str, url_prefix: str, file_ext: str
    ) -> "Component":
        root_path, path = self._get_component_path(prefix, name, file_ext=file_ext)
        component = Component(
            name=name,
            url_prefix=url_prefix,
            path=path,
        )
        tmpl_name = str(path.relative_to(root_path))

        component.tmpl = self.jinja_env.get_template(tmpl_name)
        return component


def get_jinja_template(_catalog, template_def, fields=None):
    if fields is None:
        fields = []
    jinja_content = None
    for component in _catalog.jinja_env.loader.searchpath:
        if component["component_file"].endswith(template_def["layout"]):
            with open(component["component_file"], "r") as file:
                jinja_content = file.read()
    if not jinja_content:
        raise Exception("%s was not found" % (template_def["layout"]))
    assembled_template = [jinja_content]
    if "blocks" in template_def:
        for blk_name, blk in template_def["blocks"].items():
            component_content = ""
            for field in fields:
                component_content = component_content + "%s={%s} " % (field, field)
            component_str = "<%s %s> </%s>" % (blk, component_content, blk)
            assembled_template.append(
                "{%% block %s %%}%s{%% endblock %%}" % (blk_name, component_str)
            )
    assembled_template = "\n".join(assembled_template)
    return assembled_template


def lazy_string_encoder(obj):
    if isinstance(obj, list):
        return [lazy_string_encoder(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: lazy_string_encoder(value) for key, value in obj.items()}
    else:
        return str(obj)
