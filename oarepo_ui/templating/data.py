#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI templating data module.

This module provides data structures and utilities for handling field data
in OARepo UI templates, including the FieldData class for managing API data,
UI data, and metadata for template rendering with internationalization support.
"""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any, Protocol, cast, override

from invenio_i18n import gettext

if TYPE_CHECKING:
    from collections.abc import Mapping


log = logging.getLogger("oarepo-ui.FieldData")


class EmptyFieldDataSentinel:
    """Sentinel type for empty field data."""


type EmptyFieldDataSentinelType = type[EmptyFieldDataSentinel]

EMPTY_FIELD_DATA_SENTINEL = EmptyFieldDataSentinel


class FieldDataItemGetter(Protocol):
    """Protocol for a custom function to fix inconsistencies in API/UI data serialization."""

    def __call__(self, fd: FieldData, path: tuple[str, ...]) -> FieldData | None:
        """Return a FieldData item based on the provided path.

        The implementation should handle inconsistencies between API and UI data serialization,
        such as elements lifted above the current level in the API data but not in the UI data.
        """


type APIData = str | list | Mapping[str, Any] | None | EmptyFieldDataSentinelType
type UIData = str | list | Mapping[str, Any] | None | EmptyFieldDataSentinelType


class FieldData:
    """FieldData class for managing API and UI data in OARepo UI templates.

    This class exists to provide a unified interface for accessing and manipulating
    API & UI values, labels, hints, and help texts in OARepo UI templates. If used with
    the global methods/filters inside the filters.py module, it guarantees that
    the jinja2 template will never raise an error due to missing/incomplete data.
    """

    def __init__(
        self,
        *,
        api_data: APIData,
        ui_data: UIData,
        ui_definitions: Mapping[str, Any] | None,
        path: tuple[str, ...] = (),
        item_getter: FieldDataItemGetter | None = None,
    ):
        """Construct FieldData object.

        :param api_data: API data serialization of the record.
        :param ui_data: UI data serialization of the record.
        :param ui_definitions: UI definitions (label, hints, help etc.).
        :param path: Current path from the root of the tree. Defaults to [].
        :param item_getter: Custom function to fix inconsistencies in API/UI data serialization. Defaults to None.

        :note: For internal use only. Please use FieldData.create() instead.
        """
        self._api_data = api_data
        self._ui_data = ui_data
        self._ui_definitions = ui_definitions
        self._path = path or ()
        self._item_getter = item_getter

    @classmethod
    def create(
        cls,
        api_data: APIData,
        ui_data: Mapping[str, Any],
        ui_definitions: Mapping[str, Any],
        item_getter: FieldDataItemGetter | None = None,
    ) -> FieldData:
        """Construct FieldData object.

        :param api_data: API data serialization of the record.
        :param ui_data: UI data serialization of the record.
        :param ui_definitions: UI definitions (label, hints, help etc.).
        :param path: Current path from the root of the tree. Defaults to [].
        :param item_getter: Custom function to fix inconsistencies in API/UI data serialization. Defaults to None.
        """
        ui_value = dict(ui_data.get("ui", ui_data))
        ui_value = {"metadata": ui_value, **ui_value}

        return cls(
            api_data=api_data,
            ui_data=ui_value,
            ui_definitions=ui_definitions,
            item_getter=item_getter,
        )

    @staticmethod
    def translate(x: str) -> str:
        """Translate UI definition of the node.

        :param x: String path value of the UI definition.
        :return: Translated value of the UI definition.
        """
        if not x:
            return ""
        return cast("str", gettext(x))

    @override
    def __str__(self) -> str:
        """Return string representation of FieldData.

        :return: String representation of FieldData
        """
        return self.__repr__()

    @override
    def __repr__(self) -> str:
        """Return string representation of FieldData.

        :return: String representation of FieldData
        """
        return f"""FieldData(
                        api_data={self._api_data},
                        ui_data={self._ui_data},
                        ui_definitions={self._ui_definitions},
                        path={self._path},
                        item_getter={self._item_getter}
                        """

    def _extract_children_ui_data(self, name: str, ui_data: UIData) -> dict | EmptyFieldDataSentinelType:
        if ui_data is EMPTY_FIELD_DATA_SENTINEL:
            return EMPTY_FIELD_DATA_SENTINEL

        if not isinstance(ui_data, dict):
            log.error("Error in template: trying to get children UI data from %s", ui_data)
            return EMPTY_FIELD_DATA_SENTINEL

        # construct prefix for UI fields
        prefix = f"{name}_"

        # try to find all fields with that prefix and keep only suffixes as keys(e.g. l10n_long etc.)
        children_ui_data = {k[len(prefix) :]: v for k, v in ui_data.items() if k.startswith(prefix)}

        if not children_ui_data:
            # check if there is exact match of the key
            children_ui_data = ui_data[name] if ui_data and name in ui_data else {}

        return children_ui_data

    def __getitem__(self, name: str) -> FieldData:
        """Get 1 level deeper defined by name in the nested structure.

        Example usage: metadata['creators'], etc.

        :param name: Name of key to search in nested structure.
        :raises ValueError: If API data is a list. Use FieldData.array(value) instead.
        :return: Nested value of FieldData. Could be empty if key with the given name does not exist.
        """
        # If there are inconsistencies in API/UI data, you can define custom function
        # to handle this case, so the trees are the same.
        # Otherwise UI data could end up empty.
        if self._item_getter:
            res = self._item_getter(self, (*self._path, name))
            if res is not None:
                return res

        # Indexing in dictionaries is not supported
        if isinstance(self._api_data, list):
            log.error("Indexing inside a list is not allowed, please call FiedData.array(value) first.")
            return EMPTY_FIELD_DATA

        if not isinstance(self._api_data, dict):
            log.error("Error in template: trying to get item %s from %s", name, self)
            return EMPTY_FIELD_DATA

        children_api_data = self._api_data.get(name, None)

        if children_api_data is None:
            return EMPTY_FIELD_DATA

        if isinstance(self._ui_definitions, dict):
            children_ui_defs = self._ui_definitions.get("children", {}).get(name, {})
        else:
            children_ui_defs = {}
        children_ui_data = self._extract_children_ui_data(
            name,
            (self._ui_data if isinstance(self._ui_data, dict) else EMPTY_FIELD_DATA_SENTINEL),
        )

        return FieldData(
            api_data=children_api_data,
            ui_data=children_ui_data,
            ui_definitions=children_ui_defs,
            path=(*self._path, name),
            item_getter=self._item_getter,
        )

    @staticmethod
    def value(fd: FieldData, default: str = "") -> Any:
        """Return API value of the node.

        :param fd: Current FieldData node.
        :param default: Value to return if API data is not present.
        :return: API value of the node (string, dictionary, list, etc.) or the default value.
        """
        return fd._api_data if fd._api_data is not EMPTY_FIELD_DATA_SENTINEL else default

    @staticmethod
    def ui_value(
        fd: FieldData,
        format: str = "",  # noqa: A002 keep the "format" name
        default: str = "",
    ) -> str:
        """Return UI value of the node. Falls back to API value if UI value does not exist.

        :param fd: Current FieldData node.
        :param format: Format of the UI value (e.g., "l10_long"). Defaults to an empty string.
        :param default: Value to return if neither UI nor API data is present.
        :return: UI or API value of the node (string, dict, list, etc.).
        """
        if fd._ui_data is EMPTY_FIELD_DATA_SENTINEL:
            return str(fd._api_data) if fd._api_data is not EMPTY_FIELD_DATA_SENTINEL else default

        if not isinstance(fd._ui_data, dict):
            return str(fd._ui_data)

        if format in fd._ui_data:
            return str(fd._ui_data[format])

        ret = fd._api_data if fd._api_data is not EMPTY_FIELD_DATA_SENTINEL else default
        if isinstance(ret, str):
            return ret
        if isinstance(ret, (list, dict)):
            # Convert to JSON string for better readability in templates
            return json.dumps(ret, indent=2, ensure_ascii=False)
        return str(ret)

    @staticmethod
    def label(fd: FieldData) -> str:
        """Return label of the current node.

        :param fd: Current FieldData node.
        :return: String value of the label, or a fallback message if the item does not exist.
        """
        if fd._ui_definitions is None:
            return "Item does not exist"
        return cast("str", fd._ui_definitions.get("label", "Item does not exist"))

    @staticmethod
    def help(fd: FieldData) -> str:
        """Return help of the current node.

        :param fd: Current FieldData node.
        :return: String value of the help, or a fallback message if the item does not exist.
        """
        if fd._ui_definitions is None:
            return "Item does not exist"
        return cast("str", fd._ui_definitions.get("help", "Item does not exist"))

    @staticmethod
    def hint(fd: FieldData) -> str:
        """Return hint of the current node.

        :param fd: Current FieldData node.
        :return: String value of the hint, or a fallback message if the item does not exist.
        """
        if fd._ui_definitions is None:
            return "Item does not exist"
        return cast("str", fd._ui_definitions.get("hint", "Item does not exist"))

    @staticmethod
    def array(fd: FieldData) -> list[FieldData]:
        """Return array for the current node.

        Example usage: `FieldData.array(metadata['creators'])` will return a list where
        individual creators are FieldData objects, on which methods like `value()`, `ui_value()`, etc. can be called.

        :param fd: Current FieldData node.
        :return: List of FieldData objects.
                - If the input FieldData object is a dictionary, an empty list is returned.
                - If the input is a scalar, a single-item list containing that object is returned.
        """
        ui_defs = fd._ui_definitions.get("child", {}) if fd._ui_definitions else {}
        if isinstance(fd._api_data, dict):
            log.error("FieldData.array() called in dictionary! Returning empty array, please call FieldData.dict()")
            return []

        if isinstance(fd._api_data, list):
            res = []
            if not isinstance(fd._ui_data, list):
                log.error(
                    "FieldData.array() called on a list, but UI data is not a list! "
                    "Returning empty array, please call FieldData.dict()"
                )
                return []

            for api_item, ui_item in zip(fd._api_data, fd._ui_data, strict=False):
                res.append(
                    FieldData(
                        api_data=api_item,
                        ui_data=ui_item,
                        ui_definitions=ui_defs,
                        path=fd._path,
                        item_getter=fd._item_getter,
                    )
                )

            return res

        return [fd]

    @staticmethod
    def dict(fd: FieldData) -> dict[str, FieldData]:
        """Return dictionary representation of a FieldData object.

        :param fd: Current FieldData node.
        :return: Dictionary where keys are the original keys of the node and values
                are FieldData objects.
                Returns an empty dictionary if called on a non-dictionary object.
        """
        api = fd._api_data
        if not isinstance(api, dict):
            log.error(
                "FieldData.dict() called on non-dictionary data. "
                "Returning empty dict, please call FieldData.array() or FieldData.value()."
            )
            return {}

        children_defs = fd._ui_definitions.get("children", {}) if fd._ui_definitions else {}
        result = {}

        # Iterate through each api key, val pair
        for field_name, field_api_val in api.items():
            children_ui_data = fd._extract_children_ui_data(field_name, fd._ui_data)
            ui_def = children_defs.get(field_name, {})
            result[field_name] = FieldData(
                api_data=field_api_val,
                ui_data=children_ui_data,
                ui_definitions=ui_def,
                path=(*fd._path, field_name),
                item_getter=fd._item_getter,
            )

        return result

    def __bool__(self):
        """Return True if the FieldData object has non-empty API data."""
        return self._api_data not in ([], {}, None, "", EMPTY_FIELD_DATA_SENTINEL)


EMPTY_FIELD_DATA = FieldData(
    api_data=EMPTY_FIELD_DATA_SENTINEL,
    ui_data=EMPTY_FIELD_DATA_SENTINEL,
    ui_definitions={},
    path=(),
    item_getter=None,
)
