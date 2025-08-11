from __future__ import annotations

from typing import Any, Callable, Protocol, Literal

from oarepo_runtime.i18n import gettext
import logging

log = logging.getLogger("oarepo-ui.FieldData")

EMPTY_FIELD_DATA_SENTINEL = "sentinel: empty field data"


class FieldDataItemGetter(Protocol):
    def __call__(self, fd: FieldData, path: list[str]) -> FieldData | None: ...


class FieldData:
    def __init__(
        self,
        *,
        api_data: str | list | dict | None | Literal["sentinel: empty field data"],
        ui_data: str | list | dict | None,
        ui_definitions: dict | None,
        path: list[str] = [],
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
        self._path = path or []
        self._item_getter = item_getter

    @classmethod
    def create(
        cls,
        api_data: str | list | dict | None | Literal["sentinel: empty field data"],
        ui_data: str | list | dict | None,
        ui_definitions: dict | None,
        item_getter: FieldDataItemGetter | None = None,
    ):
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
        """
        Translate UI definition of the node.

        :param x: String path value of the UI definition.
        :return: Translated value of the UI definition.
        """
        if not x:
            return ""
        return gettext(x)

    def __str__(self) -> str:
        """String representation of FieldData

        :return: String representation of FieldData
        """
        return self.__repr__()

    def __repr__(self) -> str:
        """String representation of FieldData

        :return: String representation of FieldData
        """

        return f"""FieldData(
                        api_data={self._api_data}, 
                        ui_data={self._ui_data}, 
                        ui_definitions={self._ui_definitions},
                        path={self._path},
                        item_getter={self._item_getter}
                        """

    def _extract_children_ui_data(self, name: str, ui_data: dict) -> dict:
        if ui_data == EMPTY_FIELD_DATA_SENTINEL:
            return EMPTY_FIELD_DATA_SENTINEL
        
        # construct prefix for UI fields 
        prefix = f"{name}_"
        
        # try to find all fields with that prefix and keep only suffixes as keys(e.g. l10n_long etc.) 
        children_ui_data = {
            k[len(prefix):]: v
            for k, v in ui_data.items()
            if k.startswith(prefix)
        }
        
        if not children_ui_data:
            # check if there is exact match of the key
            if ui_data and name in ui_data:
                children_ui_data = ui_data[name]
            else:
                children_ui_data = {}
        return children_ui_data
        
    
    def __getitem__(self, name: str) -> FieldData:
        """
        Get 1 level deeper defined by name in the nested structure.

        Example usage: metadata['creators'], etc.

        :param name: Name of key to search in nested structure.
        :raises ValueError: If API data is a list. Use FieldData.array(value) instead.
        :return: Nested value of FieldData. Could be empty if key with the given name does not exist.
        """

        # If there are inconsistencies in API/UI data, you can define custom function to handle this case, so the trees are the same.
        # Otherwise UI data could end up empty.
        if self._item_getter:
            res = self._item_getter(self, self._path + [name])
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

        children_ui_defs = self._ui_definitions.get("children", {}).get(name, {})
        children_ui_data = self._extract_children_ui_data(name, self._ui_data)
        
        return FieldData(
            api_data=children_api_data,
            ui_data=children_ui_data,
            ui_definitions=children_ui_defs,
            path=self._path + [name],
            item_getter=self._item_getter,
        )

    @staticmethod
    def value(fd: FieldData, default: str = "") -> Any:
        """
        Return API value of the node.

        :param fd: Current FieldData node.
        :param default: Value to return if API data is not present.
        :return: API value of the node (string, dictionary, list, etc.) or the default value.
        """
        return fd._api_data if fd._api_data != EMPTY_FIELD_DATA_SENTINEL else default

    @staticmethod
    def ui_value(fd: FieldData, format: str = "", default: str = "") -> Any:
        """
        Return UI value of the node. Falls back to API value if UI value does not exist.

        :param fd: Current FieldData node.
        :param format: Format of the UI value (e.g., "l10_long"). Defaults to an empty string.
        :param default: Value to return if neither UI nor API data is present.
        :return: UI or API value of the node (string, dict, list, etc.).
        """
        if fd._ui_data == EMPTY_FIELD_DATA_SENTINEL:
            return fd._api_data if fd._api_data != EMPTY_FIELD_DATA_SENTINEL else default

        if not isinstance(fd._ui_data, dict):
            return fd._ui_data

        if format in fd._ui_data:
            return fd._ui_data[format]
        else:
            return fd._api_data if fd._api_data != EMPTY_FIELD_DATA_SENTINEL else default

    @staticmethod
    def label(fd: FieldData) -> str:
        """
        Return label of the current node.

        :param fd: Current FieldData node.
        :return: String value of the label, or a fallback message if the item does not exist.
        """
        return fd._ui_definitions.get("label", "Item does not exist")

    @staticmethod
    def help(fd: FieldData) -> str:
        """
        Return help of the current node.

        :param fd: Current FieldData node.
        :return: String value of the help, or a fallback message if the item does not exist.
        """
        return fd._ui_definitions.get("help", "Item does not exist")

    @staticmethod
    def hint(fd: FieldData) -> str:
        """
        Return hint of the current node.

        :param fd: Current FieldData node.
        :return: String value of the hint, or a fallback message if the item does not exist.
        """
        return fd._ui_definitions.get("hint", "Item does not exist")

    @staticmethod
    def array(fd: FieldData) -> list[FieldData]:
        """
        Return array for the current node.

        Example usage: `FieldData.array(metadata['creators'])` will return a list where
        individual creators are FieldData objects, on which methods like `value()`, `ui_value()`, etc. can be called.

        :param fd: Current FieldData node.
        :return: List of FieldData objects.
                - If the input FieldData object is a dictionary, an empty list is returned.
                - If the input is a scalar, a single-item list containing that object is returned.
        """
        ui_defs = fd._ui_definitions.get("child", {})
        if isinstance(fd._api_data, dict):
            log.error(
                "FieldData.array() called in dictionary! Returning empty array, please call FieldData.dict()"
            )
            return []
        
        if isinstance(fd._api_data, list):
            res = []
            for api_item, ui_item in zip(fd._api_data, fd._ui_data):
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
        """
        Return dictionary representation of a FieldData object, where keys are strings and values are FieldData objects.

        :param fd: Current FieldData node.
        :return: Dictionary where keys are the original keys of the node and values are FieldData objects.
                Returns an empty dictionary if called on a non-dictionary object.
        """
        api = fd._api_data
        if not isinstance(api, dict):
            log.error(
                "FieldData.dict() called on non-dictionary data. Returning empty dict, please call FieldData.array() or FieldData.value()."
            )
            return {}

        children_defs = fd._ui_definitions.get("children", {})
        result = {}

        # Iterate through each api key, val pair
        for field_name, field_api_val in api.items():
            children_ui_data = fd._extract_children_ui_data(field_name, fd._ui_data)
            ui_def = children_defs.get(field_name, {})
            result[field_name] = FieldData(
                api_data=field_api_val,
                ui_data=children_ui_data,
                ui_definitions=ui_def,
                path=fd._path + [field_name],
                item_getter=fd._item_getter,
            )

        return result

    def __bool__(self):
        return self._api_data not in ([], {}, None, "", EMPTY_FIELD_DATA_SENTINEL)


EMPTY_FIELD_DATA = FieldData(
    api_data=EMPTY_FIELD_DATA_SENTINEL,
    ui_data=EMPTY_FIELD_DATA_SENTINEL,
    ui_definitions={},
    path=None,
    item_getter=None,
)
