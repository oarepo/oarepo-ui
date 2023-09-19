import json as json_lib
import sys
from oarepo_runtime.cli import oarepo

from oarepo_ui.proxies import current_oarepo_ui


import json
import os
from pathlib import Path

import click
from flask import current_app
from flask.cli import with_appcontext
from importlib_metadata import entry_points


@oarepo.group("ui")
def ui():
    """UI commands"""


@ui.command("renderers")
@click.option("-v", "--verbose", is_flag=True, help="Verbose output")
@click.option("--json", is_flag=True, help="Format output as json")
@click.option("--output-file", help="Save output to this file")
@with_appcontext
def renderers(verbose, json, output_file):
    """List available UI renderers for (detail) page"""
    if output_file:
        of = open(output_file, "w")
    else:
        of = sys.stdout
    if json:
        json_data = []
        for macro, lib in sorted(current_oarepo_ui.templates.get_macros().items()):
            macro = macro[7:]
            json_data.append({"renderer": macro, "file": str(lib.filename)})
        json_lib.dump(json_data, of, indent=4, ensure_ascii=False)
    else:
        for macro, lib in sorted(current_oarepo_ui.templates.get_macros().items()):
            macro = macro[7:]
            if verbose:
                print(f"{macro:40s}: {lib.filename}", file=of)
            else:
                print(f"{macro:40s}: {Path(lib.filename).name}", file=of)
    if output_file:
        of.close()


@oarepo.group()
def assets():
    "OARepo asset addons"


@assets.command()
@click.argument("output_file")
@click.option("--repository-dir")
@click.option("--assets-dir", default=".assets")
@with_appcontext
def collect(output_file, repository_dir, assets_dir):
    asset_deps = []
    aliases = {}
    theme = (current_app.config["APP_THEME"] or ["semantic-ui"])[0]

    for ep in entry_points(group="invenio_assets.webpack"):
        webpack = ep.load()
        if theme in webpack.themes:
            asset_deps.append(webpack.themes[theme].path)
            aliases.update(webpack.themes[theme].aliases)

    app_and_blueprints = [current_app] + list(current_app.blueprints.values())

    static_deps = []
    instance_path = current_app.instance_path
    if instance_path[-1] != "/":
        instance_path += "/"

    for bp in app_and_blueprints:
        if (
            bp.has_static_folder
            and os.path.isdir(bp.static_folder)
            and not bp.static_folder.startswith(instance_path)
        ):
            static_deps.append(bp.static_folder)

    root_aliases = {}
    asset_paths = [Path(x) for x in asset_deps]
    for alias, path in aliases.items():
        for pth in asset_paths:
            possible_path = pth / path
            if possible_path.exists():
                try:
                    relative_path = str(
                        possible_path.relative_to(repository_dir or os.getcwd())
                    )
                    root_aliases[alias] = "./" + relative_path
                except ValueError:
                    root_aliases[alias] = str(Path(assets_dir) / path)

    with open(output_file, "w") as f:
        json.dump(
            {
                "assets": asset_deps,
                "static": static_deps,
                "@aliases": aliases,
                "@root_aliases": root_aliases,
            },
            f,
            indent=4,
            ensure_ascii=False,
        )


@assets.command(name="less-components")
@click.argument("output_file")
@with_appcontext
def less_components(output_file):
    with open(output_file, "w") as f:
        json.dump(
            {"components": current_app.config.get("OAREPO_UI_LESS_COMPONENTS", [])}, f
        )


@assets.command(help="Create vite directory and configuration files")
@click.argument("root_dir")
@click.argument("output_file")
@with_appcontext
def vite(output_file, root_dir):
    theme = (current_app.config["APP_THEME"] or ["semantic-ui"])[0]
    root_dir = Path(root_dir).resolve()
    assets_path = (Path.cwd() / 'assets').relative_to(root_dir)
    aliases = {
        "~semantic-ui-less/themes/../../less/site/globals": assets_path / "less/site/globals",
        "~": "node_modules/",
        "../../fonts/Lato-(.*)": get_theme_dir('invenio_theme', theme, root_dir) / "less/invenio_theme/fonts/Lato-$1",
        "../../../themes/default/assets/fonts/":
            ".venv/var/instance/assets/node_modules/semantic-ui-css/themes/default/assets/fonts/",
    }
    entries = {}
    dependencies = {}

    vite_prohibited_aliases = {"../../less/site", "../../less"}
    vite_extra_aliases = {
        "../../less/site/globals": "less/site/globals",
    }

    for ep in entry_points(group="invenio_assets.webpack"):
        webpack = ep.load()
        if theme in webpack.themes:
            t = webpack.themes[theme]
            for alias_name, alias_value in webpack.themes[theme].aliases.items():
                if alias_name in vite_prohibited_aliases:
                    continue
                generate_alias(aliases, alias_name, alias_value, t.path, root_dir)
            generate_less_alias(aliases, t.path, root_dir)
            for entry_name, entry_value in webpack.entry.items():
                entries[entry_name] = str(
                    Path(t.path).joinpath(entry_value).absolute().relative_to(root_dir)
                )
            for k, v in t.dependencies.items():
                dependencies.setdefault(k, {}).update(v)

    for alias_name, alias_value in vite_extra_aliases.items():
        generate_alias(
            aliases, alias_name, alias_value, Path().cwd().absolute(), root_dir
        )

    with open(output_file, "w") as f:
        json.dump(
            {
                "aliases": {str(k): str(v) for k, v in aliases.items()},
                "entries": entries,
                "dependencies": dependencies,
            },
            f,
            indent=4,
            ensure_ascii=False,
            default=str
        )

    return


def generate_alias(aliases, alias_name, alias_value, path, root_dir):
    alias_full_path = Path(path).joinpath(alias_value)
    if not alias_full_path.exists():
        # try to get site-wide path
        site_path = Path.cwd().absolute() / "assets"
        if site_path.joinpath(alias_value).exists():
            alias_full_path = site_path.joinpath(alias_value)
    assert (
        alias_full_path.exists()
    ), f"Path in alias does not exist: {alias_name=} {alias_value=} {path=}"
    aliases[alias_name] = str(alias_full_path.relative_to(root_dir))


def generate_less_alias(aliases, path, root_dir):
    already_generated = []
    for pth in Path(path).glob("**/less"):
        for apt in reversed(list(pth.glob("**"))):
            if apt == pth:
                continue
            if not apt.is_dir():
                continue
            relative = apt.relative_to(pth)
            already_generated.append(relative.parent)
            if relative not in already_generated:
                aliases[str(relative)] = str(apt.resolve().relative_to(root_dir))

def get_theme_dir(pkg, theme, root_dir):
    for ep in entry_points(group="invenio_assets.webpack"):
        if ep.name != pkg:
            continue
        webpack = ep.load()
        if theme in webpack.themes:
            t = webpack.themes[theme]
            return Path(t.path).relative_to(root_dir)