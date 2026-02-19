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

from .allow_method import allow_method
from .base import (
    no_cache_response,
    pass_query_args,
    pass_route_args,
    secret_link_or_login_required,
)
from .content_negotiation import record_content_negotiation
from .pass_draft import pass_draft, pass_draft_files
from .pass_draft_community import pass_draft_community
from .pass_record import (
    pass_record_files,
    pass_record_latest,
    pass_record_media_files,
    pass_record_or_draft,
)
from .signposting import response_header_signposting

__all__ = (
    "allow_method",
    "no_cache_response",
    "pass_draft",
    "pass_draft_community",
    "pass_draft_files",
    "pass_query_args",
    "pass_record_files",
    "pass_record_latest",
    "pass_record_media_files",
    "pass_record_or_draft",
    "pass_route_args",
    "record_content_negotiation",
    "response_header_signposting",
    "secret_link_or_login_required",
)
