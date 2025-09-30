#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations

import json

from invenio_config.default import ALLOWED_HTML_ATTRS, ALLOWED_HTML_TAGS


def test_create(app, client_with_credentials, extra_entry_points):
    with client_with_credentials.get("/simple-model/uploads/new") as c:
        print(c.text)
        response = json.loads(c.text)
        response["data"].pop("created")
        response["data"].pop("updated")
        response["record"].pop("created")
        response["record"].pop("updated")

