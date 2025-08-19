#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI custom fields module.

This module provides custom field implementations for OARepo UI,
including complex field types that support nested custom fields
with proper mapping configuration for Opensearch indexing.
"""

from __future__ import annotations

from typing import Any

from invenio_records_resources.services.custom_fields import BaseListCF
from marshmallow import fields


class ComplexCF(BaseListCF):
    """Complex custom field with nested custom fields support."""

    def __init__(
        self,
        name: str,
        nested_custom_fields: list,
        multiple: bool = False,
        **kwargs: Any,
    ) -> None:
        """Initialize a ComplexCF instance."""
        nested_fields = {cf.name: cf.field for cf in nested_custom_fields}

        super().__init__(
            name,
            field_cls=fields.Nested,
            field_args={"nested": nested_fields},
            multiple=multiple,
            **kwargs,
        )
        self.nested_custom_fields = nested_custom_fields

    @property
    def mapping(  # pyright: ignore[reportIncompatibleMethodOverride]
        self,
    ) -> dict[str, Any]:
        """Return mapping for OpenSearch indexing."""
        return {
            "type": "object",
            "properties": {cf.name: cf.mapping for cf in self.nested_custom_fields},
        }
