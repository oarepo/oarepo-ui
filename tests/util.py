#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#


def _clean_unstable_fields(response):
    if "record" in response:
        response["record"].pop("created", None)
        response["record"].pop("updated", None)
        if "parent" in response["record"]:
            response["record"]["parent"].pop("created", None)
            response["record"]["parent"].pop("updated", None)
