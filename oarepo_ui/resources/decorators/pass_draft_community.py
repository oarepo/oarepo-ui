#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#

"""Decorator to pass community data when creating a draft."""

from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import TYPE_CHECKING, Any, cast

from flask import g, request
from invenio_communities.communities.resources.serializer import UICommunityJSONSerializer
from invenio_communities.proxies import current_communities

if TYPE_CHECKING:
    from oarepo_ui.resources.records.resource import RecordsUIResource


def pass_draft_community[T: Callable](f: T) -> T:
    """Retrieve the community record using the community service.

    Pass the community record or None when creating a new draft and having
    selected a community via the url.
    """

    @wraps(f)
    def view(self: RecordsUIResource, **kwargs: Any) -> Any:
        comid = request.args.get("community")
        if comid:
            community = current_communities.service.read(id_=comid, identity=g.identity)
            kwargs["community"] = community
            kwargs["community_ui"] = UICommunityJSONSerializer().dump_obj(community.to_dict())

        return f(self, **kwargs)

    return cast("T", view)
