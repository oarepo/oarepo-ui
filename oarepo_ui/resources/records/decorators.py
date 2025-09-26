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

from functools import wraps
from typing import TYPE_CHECKING

from flask import g, redirect, url_for
from invenio_records_resources.services.errors import PermissionDeniedError
from sqlalchemy.orm.exc import NoResultFound

if TYPE_CHECKING:
    from oarepo_ui.resources.records.resource import RecordsUIResource


def pass_record_or_draft(expand=True):
    """Decorator to retrieve the draft using the record service."""

    def decorator(f):
        @wraps(f)
        def view(self: RecordsUIResource, **kwargs):
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


def pass_record_files(f):
    """Decorate a view to pass a record's files using the files service."""

    @wraps(f)
    def view(self: RecordsUIResource, **kwargs):
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


def pass_record_media_files(f):
    """Decorate a view to pass a record's media files using the files service."""

    @wraps(f)
    def view(self: RecordsUIResource, **kwargs):
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
