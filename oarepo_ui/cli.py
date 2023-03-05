from oarepo_runtime.cli import oarepo
from flask.cli import with_appcontext
from oarepo_ui.proxies import current_oarepo_ui
import click
from pathlib import Path


@oarepo.group("ui")
def ui():
    """UI commands"""


@ui.command("renderers")
@click.option("-v", "--verbose", is_flag=True, help="Verbose output")
@with_appcontext
def renderers(verbose):
    """List available UI renderers for (detail) page"""
    for macro, lib in sorted(current_oarepo_ui.templates.get_macros().items()):
        macro = macro[7:]
        if verbose:
            print(f"{macro:40s}: {lib.filename}")
        else:
            print(f"{macro:40s}: {Path(lib.filename).name}")
