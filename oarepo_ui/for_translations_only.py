#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI translations module.

This module contains string constants used for internationalization and
localization purposes. It includes API-related strings and HTTP error
messages that need to be translated in the user interface.
"""

from __future__ import annotations

from gettext import gettext as _

translated_strings: list[str] = [
    _("api.draft"),
    _("api.latest"),
    _("api.files"),
    _("api.latest_html"),
    _("api.publish"),
    _("api.record"),
    _("api.self_html"),
    _("api.versions"),
    _("The browser (or proxy) sent a request that this server could not understand."),
    _(
        "The server could not verify that you are authorized to access the URL "
        "requested. You either supplied the wrong credentials (e.g. a bad "
        "password), or your browser doesn't understand how to supply the "
        "credentials required."
    ),
    _(
        "You don't have the permission to access the requested resource. It is "
        "either read-protected or not readable by the server."
    ),
    _(
        "The requested URL was not found on the server. If you entered the URL "
        "manually please check your spelling and try again."
    ),
    _("The method is not allowed for the requested URL."),
    _(
        "The resource identified by the request is only capable of generating "
        "response entities which have content characteristics not acceptable "
        "according to the accept headers sent in the request."
    ),
    _(
        "The server closed the network connection because the browser didn't "
        "finish the request within the specified time."
    ),
    _(
        "A conflict happened while processing the request. The resource might "
        "have been modified while the request was being processed."
    ),
    _(
        "The requested URL was not found on the server. If you entered the URL "
        "manually please check your spelling and try again."
    ),
    _(
        "The requested URL is no longer available on this server and there is "
        "no forwarding address. If you followed a link from a foreign page, "
        "please contact the author of this page."
    ),
    _("The precondition on the request for the URL failed positive evaluation."),
    _("The data value transmitted exceeds the capacity limit."),
    _("The length of the requested URL exceeds the capacity limit for this server. The request cannot be processed."),
    _("The server does not support the media type transmitted in the request."),
    _("The server cannot provide the requested range."),
    _("The server could not meet the requirements of the Expect header"),
    _("This server is a teapot, not a coffee machine"),
    _("The request was well-formed but was unable to be followed due to semantic errors."),
    _("The resource that is being accessed is locked."),
    _(
        "The method could not be performed on the resource because the "
        "requested action depended on another action and that action failed."
    ),
    _("This request is required to be conditional; try using 'If-Match' or 'If-Unmodified-Since'."),
    _("This user has exceeded an allotted request count. Try again later."),
    _("One or more header fields exceeds the maximum size."),
    _("Unavailable for legal reasons."),
    _(
        "The server encountered an internal error and was unable to complete "
        "your request. Either the server is overloaded or there is an error "
        "in the application."
    ),
    _("The server does not support the action requested by the browser."),
    _("The proxy server received an invalid response from an upstream server."),
    _(
        "The server is temporarily unable to service your request due to "
        "maintenance downtime or capacity problems. Please try again later."
    ),
    _("The connection to an upstream server timed out."),
    _("The server does not support the HTTP protocol version used in the request."),
]
