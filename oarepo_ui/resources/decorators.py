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
from invenio_records_resources.services.errors import PermissionDeniedError
from sqlalchemy.orm.exc import NoResultFound
from werkzeug import Response
from invenio_pidstore.errors import PIDDoesNotExistError

if TYPE_CHECKING:
    from oarepo_ui.resources.records.resource import RecordsUIResource


def pass_record_or_draft[T: Callable](expand: bool=True) -> T:
    """Decorator to retrieve the draft using the record service."""

    def decorator(f):
        @wraps(f)
        def view(self: RecordsUIResource, **kwargs: Any):
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
                    print("NRF")
                    try:
                        record = service.read(include_deleted=include_deleted, **read_kwargs)
                    except NoResultFound:
                        print("NRF2")
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

def pass_draft[T: Callable](expand=True) -> T:
    def decorator(f):
        @wraps(f)
        def view(self: RecordsUIResource, **kwargs: Any):
            pid_value = kwargs.get("pid_value")
            try:
                record_service = self.api_service
                draft = record_service.read_draft(
                    id_=pid_value,
                    identity=g.identity,
                    expand=expand,
                )
                kwargs["draft"] = draft
                kwargs["files_locked"] = (
                    record_service.config.lock_edit_published_files(
                        record_service, g.identity, draft=draft, record=draft._record
                    )
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

def pass_draft_files[T: Callable](f) -> T:
    @wraps(f)
    def view(self:RecordsUIResource,**kwargs):
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
    def view(self: RecordsUIResource, **kwargs: Any):
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
    def view(self: RecordsUIResource, **kwargs: Any):
        is_preview = kwargs.get("is_preview")
        pid_value = kwargs.get("pid_value")
        read_kwargs = {"id_": pid_value, "identity": g.identity}

        service = self.api_service
        # try:
        #     if is_preview:
        #         # TODO: implement draft_media_files service
        #         media_files = service.draft_media_files.list_files(**read_kwargs)
        #     else:
        #         # TODO: implement media_files service
        #         media_files = service.media_files.list_files(**read_kwargs)

        #     kwargs["media_files"] = media_files

        # except PermissionDeniedError:
        #     # this is handled here because we don't want a 404 on the landing
        #     # page when a user is allowed to read the metadata but not the
        #     # files
        #     kwargs["media_files"] = None
        # TODO: remove & uncomment after fixing above todos
        kwargs["media_files"] = None

        return f(self, **kwargs)

    return view

def secret_link_or_login_required[T: Callable]() -> T:
    def decorator(f):
        @wraps(f)
        def view(self, **kwargs: Any):
            secret_link_token_arg = "token"
            session_token = session.get(secret_link_token_arg, None)
            if session_token is None:
                login_required(f)
            return f(self, **kwargs)

        return view

    return decorator


def no_cache_response[T: Callable](f: T) -> T:
    @wraps(f)
    def inner(*args: Any, **kwargs: Any) -> Response:
        """Inner function to add signposting link to response headers."""
        response = f(*args, **kwargs)

        response.cache_control.no_cache = True
        response.cache_control.no_store = True
        response.cache_control.must_revalidate = True

        return response
    return inner   # type: ignore[return-value]