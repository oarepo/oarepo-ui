import html
from oarepo_runtime.i18n import gettext
from typing import Union


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
            return x
        return gettext(x)

    @property
    def _ui_label(self):
        return self.translate(self.__ui.get("label"))

    @property
    def _ui_hint(self):
        return self.translate(self.__ui.get("hint"))

    @property
    def _ui_help(self):
        return self.translate(self.__ui.get("help"))

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
                    self.__data.get(name), self.__ui.get("children", {}).get(name, {}), self.__path + [name]
                )
            else:
                return EMPTY_FIELD_DATA

        if isinstance(self.__data, list):
            idx = int(name)
            if idx < len(self.__data):
                return FieldData(
                    self.__data[idx], self.__ui.get("child", {}), self.__path + [idx]
                )
            return EMPTY_FIELD_DATA

        return EMPTY_FIELD_DATA

    def __getattr__(self, name):
        return self.__get(name)

    def __getitem__(self, name):
        return self.__(name)

    def __contains__(self, item):
        return True

    def _as_array(self):
        ret = []
        if isinstance(self.__data, list):
            for val in self.__data:
                ret.append(FieldData(val, self.__ui.get("child", {})))
        elif isinstance(self.__data, dict):
            for key, val in self.__data.items():
                ret.append(FieldData(val, self.__ui.get("children", {}).get(key, {})))
        return ret

    @property
    def _is_empty(self):
        return not bool(self.__data)

    @property
    def _is_array(self):
        return isinstance(self.__data, (list, tuple))


EMPTY_FIELD_DATA = FieldData({}, {})
