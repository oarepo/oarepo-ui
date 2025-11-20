#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#

"""Record views record draft decorators."""

from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import TYPE_CHECKING, Any, ParamSpec, TypeVar, cast

from flask import g, redirect, url_for
from invenio_pidstore.errors import PIDDoesNotExistError
from invenio_records_resources.services.errors import PermissionDeniedError
from oarepo_runtime.typing import record_from_result

if TYPE_CHECKING:
    from oarepo_ui.resources.records.resource import RecordsUIResource

P = ParamSpec("P")
R = TypeVar("R")


def pass_draft(expand: bool = True) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Retrieve the draft record using the record service."""

    def decorator(f: Callable[P, R]) -> Callable[P, R]:
        @wraps(f)
        def view(*args: P.args, **kwargs: P.kwargs) -> Any:
            self = cast("RecordsUIResource", args[0])
            pid_value = kwargs.get("pid_value")
            try:
                record_service = self.api_service
                draft = record_service.read_draft(
                    id_=pid_value,
                    identity=g.identity,
                    expand=expand,
                )
                kwargs["draft"] = draft
                kwargs["files_locked"] = record_service.config.lock_edit_published_files(
                    record_service,
                    g.identity,
                    draft=draft,
                    record=record_from_result(draft),
                )
                return f(*args, **kwargs)
            except PIDDoesNotExistError:
                # Redirect to /records/:id because users are interchangeably
                # using /records/:id and /uploads/:id when sharing links, so in
                # case a draft doesn't exists, when check if the record exists
                # always.
                return redirect(
                    url_for(
                        f"{self.config.blueprint_name}.record_detail",
                        pid_value=pid_value,
                    )
                )

        return cast("Callable[P, R]", view)

    return decorator


def pass_draft_files[T: Callable](f: T) -> T:
    """Retrieve draft files for the view and pass them as a keyword argument.

    Attempts to fetch draft files using the API service. If the user lacks permission,
    `draft_files` is set to `None` to avoid raising a 404 on the landing page.
    """

    @wraps(f)
    def view(self: RecordsUIResource, **kwargs: Any) -> Any:
        files_service = self.api_service.draft_files
        try:
            pid_value = kwargs.get("pid_value")
            files = files_service.list_files(id_=pid_value, identity=g.identity) if files_service else None
            kwargs["draft_files"] = files
        except PermissionDeniedError:
            # this is handled here because we don't want a 404 on the landing
            # page when a user is allowed to read the metadata but not the
            # files
            kwargs["draft_files"] = None

        return f(self, **kwargs)

    return cast("T", view)
