from oarepo_ui.resources.templating.data import FieldData


def value(value):
    assert isinstance(value, FieldData)
    return FieldData.value(value)

def ui_value(value: FieldData, format: str = ""):
    assert isinstance(value, FieldData)
    return FieldData.ui_value(value, format=format)

def as_array(value: FieldData):
    assert isinstance(value, FieldData)
    return FieldData.array(value)

def as_dict(value: FieldData):
    assert isinstance(value, FieldData)
    return FieldData.dict(value)

def empty(value: FieldData):
    assert isinstance(value, FieldData)
    return not bool(value) 
