# SPDX-FileCopyrightText: 2025 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

from __future__ import annotations


def _clean_unstable_fields(response) -> None:
    if "record" in response:
        response["record"].pop("created", None)
        response["record"].pop("updated", None)
        if "parent" in response["record"]:
            response["record"]["parent"].pop("created", None)
            response["record"]["parent"].pop("updated", None)
