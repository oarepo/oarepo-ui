#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#

"""Record views decorators."""

from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import TYPE_CHECKING, Any

from flask import g, redirect, session, url_for
from flask_security import login_required
from invenio_pidstore.errors import PIDDoesNotExistError
from invenio_records_resources.services.errors import PermissionDeniedError
from sqlalchemy.orm.exc import NoResultFound

if TYPE_CHECKING:
    from werkzeug import Response

    from oarepo_ui.resources.records.resource import RecordsUIResource


def pass_record_or_draft[T: Callable](expand: bool = True) -> T:
    """Retrieve the published record or draft using the record service.

    Passes a draft record instance to decorated function when `is_preview` query arg is set,
    otherwise, a published record instance is passed
    """

    def decorator(f: T) -> T:
        @wraps(f)
        def view(self: RecordsUIResource, **kwargs: Any) -> Any:
            pid_value = kwargs.get("pid_value")
            is_preview = kwargs.get("is_preview")
            include_deleted = kwargs.get("include_deleted", False)
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
                        record = service.read(include_deleted=include_deleted, **read_kwargs)
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
                    record = service.read(include_deleted=include_deleted, **read_kwargs)
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
            return f(self, **kwargs)

        return view

    return decorator


def pass_draft[T: Callable](expand: bool = True) -> T:
    """Retrieve the draft record using the record service."""

    def decorator(f: T) -> T:
        @wraps(f)
        def view(self: RecordsUIResource, **kwargs: Any) -> Any:
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
                    record=draft._record,  # noqa SLF001
                )
                return f(self, **kwargs)
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

        return view

    return decorator


def pass_draft_files[T: Callable](f: T) -> T:
    """Retrieve draft files for the view and pass them as a keyword argument.

    Attempts to fetch draft files using the API service. If the user lacks permission,
    `draft_files` is set to `None` to avoid raising a 404 on the landing page.
    """

    @wraps(f)
    def view(self: RecordsUIResource, **kwargs: Any) -> Any:
        try:
            pid_value = kwargs.get("pid_value")
            files = self.api_service.draft_files.list_files(id_=pid_value, identity=g.identity)
            kwargs["draft_files"] = files
        except PermissionDeniedError:
            # this is handled here because we don't want a 404 on the landing
            # page when a user is allowed to read the metadata but not the
            # files
            kwargs["draft_files"] = None

        return f(self, **kwargs)

    return view


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
                files = service.draft_files.list_files(**read_kwargs)
            else:
                files = service.files.list_files(**read_kwargs)

            kwargs["files"] = files

        except PermissionDeniedError:
            # this is handled here because we don't want a 404 on the landing
            # page when a user is allowed to read the metadata but not the
            # files
            kwargs["files"] = None

        return f(self, **kwargs)

    return view


def pass_record_media_files[T: Callable](f: T) -> T:
    """Decorate a view to pass a record's media files using the files service."""

    @wraps(f)
    def view(self: RecordsUIResource, **kwargs: Any) -> Any:
        # TODO: implement draft_media_files service
        # TODO: implement media_files service
        kwargs["media_files"] = None

        return f(self, **kwargs)

    return view


def secret_link_or_login_required[T: Callable]() -> T:
    """Require a secret link token or force login for the wrapped view.

    Checks for a token in the session (under key "token"). If the token is missing,
    the user is redirected to login. Otherwise, executes the wrapped view.
    """

    def decorator(f: T) -> T:
        @wraps(f)
        def view(self: RecordsUIResource, **kwargs: Any) -> Any:
            secret_link_token_arg = "token"  # noqa S105
            session_token = session.get(secret_link_token_arg, None)
            if session_token is None:
                login_required(f)
            return f(self, **kwargs)

        return view

    return decorator


def no_cache_response[T: Callable](f: T) -> T:
    """Disable HTTP caching on the wrapped view.

    It ensures that the returned response has the following headers set:
    - ``Cache-Control: no-cache``
    - ``Cache-Control: no-store``
    - ``Cache-Control: must-revalidate``

    Useful for views where responses must never be cached by clients or proxies.
    """

    @wraps(f)
    def inner(*args: Any, **kwargs: Any) -> Response:
        """Inner function to add signposting link to response headers."""
        response = f(*args, **kwargs)

        response.cache_control.no_cache = True
        response.cache_control.no_store = True
        response.cache_control.must_revalidate = True

        return response

    return inner  # type: ignore[return-value]
