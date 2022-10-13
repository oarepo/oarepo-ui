from ctypes import Array
from typing import Union

class ComponentInfo:
    value_type: Union["object", "value", "array" , Array[Union["object", "value", "array"]]]
    members: Union[str, Array[str]]


class ListComponent(ComponentInfo):
    value_type = ['object', 'array']
    members = 'items'


class RowComponent(ComponentInfo):
    value_type = 'object'
    members = ['items', 'item']

class ColumnComponent(ComponentInfo):
    value_type = 'object'
    members = 'items'