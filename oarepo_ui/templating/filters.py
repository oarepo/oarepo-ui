#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI templating filters module.

This module provides Jinja2 template filter functions for OARepo UI,
including functions for extracting values, formatting UI data, and converting
field data to different formats (arrays, dictionaries) for template rendering.

These are used to render FieldData objects in templates in a way that is guaranteed
not to raise exceptions even if the data is not in the expected format.
"""

from __future__ import annotations

from typing import Any

from .data import FieldData


def value(value: FieldData) -> Any:
    """Extract the API value from a FieldData object.

    :param value: FieldData instance.
    :return: API value as a string.
    """
    if not isinstance(value, FieldData):
        raise TypeError(f"Expected FieldData, got {type(value).__name__}")
    return FieldData.value(value)


def ui_value(value: FieldData, format: str = "") -> str:  # noqa: A002
    """Extract the UI value from a FieldData object, optionally using a format.

    :param value: FieldData instance.
    :param format: Format string for UI value.
    :return: UI value as a string.
    """
    if not isinstance(value, FieldData):
        raise TypeError(f"Expected FieldData, got {type(value).__name__}")
    return FieldData.ui_value(value, format=format)


def as_array(value: FieldData) -> list:
    """Convert FieldData to a list of FieldData objects.

    :param value: FieldData instance.
    :return: List of FieldData objects.
    """
    if not isinstance(value, FieldData):
        raise TypeError(f"Expected FieldData, got {type(value).__name__}")
    return FieldData.array(value)


def as_dict(value: FieldData) -> dict:
    """Convert FieldData to a dictionary of FieldData objects.

    :param value: FieldData instance.
    :return: Dictionary mapping keys to FieldData objects.
    """
    if not isinstance(value, FieldData):
        raise TypeError(f"Expected FieldData, got {type(value).__name__}")
    return FieldData.dict(value)


def empty(value: FieldData) -> bool:
    """Check if the FieldData object is empty.

    :param value: FieldData instance.
    :return: True if FieldData is empty, False otherwise.
    """
    if not isinstance(value, FieldData):
        raise TypeError(f"Expected FieldData, got {type(value).__name__}")
    return not bool(value)
