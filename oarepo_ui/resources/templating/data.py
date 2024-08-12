import html
import json
from typing import Union

from oarepo_runtime.i18n import gettext


class FieldData:
    def __init__(self, data, ui, path=None):
        self.__data = data
        self.__ui = ui
        self.__path = path or []

    @property
    def _ui_value(self):
        if isinstance(self.__data, dict) and not self.__data:
            return None
        return self.__data

    @staticmethod
    def translate(x):
        if not x:
            return ""
        return gettext(x)

    @property
    def _ui_label(self):
        return self.translate(self.__ui.get("label", None))

    @property
    def _ui_hint(self):
        return self.translate(self.__ui.get("hint", None))

    @property
    def _ui_help(self):
        return self.translate(self.__ui.get("help", None))

    def __str__(self):
        return str(self._ui_value)

    def __repr__(self):
        return repr(self._ui_value)

    def __html__(self):
        return html.escape(str(self._ui_value))

    def __get(self, name: Union[str, int]):
        if isinstance(self.__data, dict):
            if name in self.__data:
                return FieldData(
                    self.__data.get(name),
                    self.__ui.get("children", {}).get(name, {}),
                    self.__path + [name],
                )
            else:
                return EMPTY_FIELD_DATA

        if isinstance(self.__data, list):
            try:
                idx = int(name)

                if idx < len(self.__data):
                    return FieldData(
                        self.__data[idx],
                        self.__ui.get("child", {}),
                        self.__path + [idx],
                    )
                return EMPTY_FIELD_DATA
            except ValueError:
                return self._select(name)

        return EMPTY_FIELD_DATA

    def __getattr__(self, name):
        return self.__get(name)

    def __getitem__(self, name):
        if isinstance(name, slice):
            return [self.__get(i) for i in range(*name.indices(len(self.__data)))]
        return self.__get(name)

    def __contains__(self, item):
        return True

    def __bool__(self):
        return bool(self._ui_value)

    def _as_array(self):
        ret = []
        if isinstance(self.__data, list):
            for val in self.__data:
                ret.append(FieldData(val, self.__ui.get("child", {})))
        elif isinstance(self.__data, dict):
            for key, val in self.__data.items():
                ret.append(FieldData(val, self.__ui.get("children", {}).get(key, {})))
        return ret

    def _filter(self, **kwargs):
        if not isinstance(self.__data, (list, tuple)):
            return EMPTY_FIELD_DATA
        ret = []
        for idx in range(len(self.__data)):
            item = self[idx]
            for k, v in kwargs.items():
                it = item[k]
                if it.__data != v:
                    break
            else:
                ret.append(item._ui_value)
        return FieldData(ret, self.__ui, self.__path)

    def _select(self, name):
        if self._is_dict:
            return self.__get(name)
        elif self._is_array:
            ret = []
            for idx in range(len(self.__data)):
                item = self[idx]
                if item[name]._has_value:
                    ret.append(item[name])
            return FieldData(ret, self.__ui, self.__path)
        return EMPTY_FIELD_DATA

    def _first(self):
        if self._is_array:
            return self[0]
        return self

    @property
    def _is_empty(self):
        if not self.__data:
            return True
        return False

    @property
    def _has_value(self):
        return bool(self.__data)

    @property
    def _is_array(self):
        return isinstance(self.__data, (list, tuple))

    @property
    def _is_dict(self):
        return isinstance(self.__data, dict)

    @property
    def _is_primitive(self):
        return self._has_value and not self._is_array and not self._is_dict

    def __eq__(self, other):
        if isinstance(other, FieldData):
            return self.__data == other.__data
        return False

    def __lt__(self, other):
        if isinstance(other, FieldData):
            return json.dumps(self.__data, sort_keys=True) < json.dumps(
                other.__data, sort_keys=True
            )
        return False


EMPTY_FIELD_DATA = FieldData({}, {})
