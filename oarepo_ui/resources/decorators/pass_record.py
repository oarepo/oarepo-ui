#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#

"""Record views record decorators."""

from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import TYPE_CHECKING, Any, ParamSpec, TypeVar, cast

from flask import g, redirect, url_for
from invenio_rdm_records.services.services import RDMRecordService
from invenio_records_resources.services.errors import PermissionDeniedError
from sqlalchemy.exc import NoResultFound

if TYPE_CHECKING:
    from oarepo_ui.resources.records.resource import RecordsUIResource

P = ParamSpec("P")
R = TypeVar("R")


def pass_record_files[T: Callable](f: T) -> T:
    """Decorate a view to pass a record's files using the files service."""

    @wraps(f)
    def view(self: RecordsUIResource, **kwargs: Any) -> Any:
        is_preview = kwargs.get("is_preview")
        pid_value = kwargs.get("pid_value")
        read_kwargs = {"id_": pid_value, "identity": g.identity}

        service = self.api_service
        try:
            if is_preview:
                files = service.draft_files.list_files(**read_kwargs) if service.draft_files else None
            else:
                files = service.files.list_files(**read_kwargs) if service.files else None

            kwargs["files"] = files

        except PermissionDeniedError:
            # this is handled here because we don't want a 404 on the landing
            # page when a user is allowed to read the metadata but not the
            # files
            kwargs["files"] = None

        return f(self, **kwargs)

    return cast("T", view)


def pass_record_media_files[T: Callable](f: T) -> T:
    """Decorate a view to pass a record's media files using the files service."""

    @wraps(f)
    def view(self: RecordsUIResource, **kwargs: Any) -> Any:
        # TODO: implement draft_media_files service
        # TODO: implement media_files service
        kwargs["media_files"] = None

        return f(self, **kwargs)

    return cast("T", view)


def pass_record_latest[T: Callable](f: T) -> T:
    """Decorate a view to pass the latest version of a record."""

    @wraps(f)
    def view(self: RecordsUIResource, **kwargs: Any) -> Any:
        pid_value = kwargs.get("pid_value")
        record_latest = self.api_service.read_latest(id_=pid_value, identity=g.identity)
        kwargs["record"] = record_latest
        return f(self, **kwargs)

    return cast("T", view)


def pass_record_or_draft(
    expand: bool = True,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Retrieve the published record or draft using the record service.

    Passes a draft record instance to decorated function when `is_preview` query arg is set,
    otherwise, a published record instance is passed
    """

    def decorator(f: Callable[P, R]) -> Callable[P, R]:
        @wraps(f)
        def view(*args: P.args, **kwargs: P.kwargs) -> Any:
            self = cast("RecordsUIResource", args[0])

            pid_value = kwargs.get("pid_value")
            is_preview = kwargs.get("is_preview")
            include_deleted = cast("bool", kwargs.get("include_deleted", False))
            read_kwargs = {
                "id_": pid_value,
                "identity": g.identity,
                "expand": expand,
            }

            service = self.api_service

            if is_preview:
                try:
                    record = service.read_draft(**read_kwargs)
                except NoResultFound:
                    try:
                        if isinstance(service, RDMRecordService):
                            record = service.read(include_deleted=include_deleted, **read_kwargs)
                        else:
                            record = service.read(**read_kwargs)
                    except NoResultFound:
                        # If the parent pid is being used we can get the id of the latest record and redirect
                        latest_version = service.read_latest(**read_kwargs)
                        return redirect(
                            url_for(
                                f"{self.config.blueprint_name}.record_detail",
                                pid_value=latest_version.id,
                                preview=1,
                            )
                        )
            else:
                try:
                    if isinstance(service, RDMRecordService):
                        record = service.read(include_deleted=include_deleted, **read_kwargs)
                    else:
                        record = service.read(**read_kwargs)
                except NoResultFound:
                    # If the parent pid is being used we can get the id of the latest record and redirect
                    latest_version = service.read_latest(**read_kwargs)
                    return redirect(
                        url_for(
                            f"{self.config.blueprint_name}.record_detail",
                            pid_value=latest_version.id,
                        )
                    )
            kwargs["record"] = record
            return f(*args, **kwargs)

        return cast("Callable[P, R]", view)

    return decorator
