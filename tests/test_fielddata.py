#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations

import json

import pytest

from oarepo_ui.templating.data import (
    EMPTY_FIELD_DATA,
    EMPTY_FIELD_DATA_SENTINEL,
    FieldData,
)
from oarepo_ui.templating.filters import as_array, as_dict, ui_value, value


def test_field_data(field_data_test_obj):
    api_value_serialization, ui_value_serialization, record = field_data_test_obj

    metadata = record["metadata"]
    assert isinstance(metadata, FieldData)

    title = metadata["title"]
    assert isinstance(title, FieldData)
    assert FieldData.value(title) == api_value_serialization["metadata"]["title"]
    assert (
        FieldData.ui_value(title) == api_value_serialization["metadata"]["title"]
    )  # should just return API value, because there is no ui representation
    assert FieldData.label(title) == "metadata/title.label"
    assert FieldData.help(title) == "metadata/title.help"
    assert FieldData.hint(title) == "metadata/title.hint"

    publisher = metadata["publisher"]
    assert isinstance(publisher, FieldData)
    assert FieldData.value(publisher) == api_value_serialization["metadata"]["publisher"]
    assert FieldData.ui_value(publisher) == api_value_serialization["metadata"]["publisher"]  # no format specified
    assert (
        FieldData.ui_value(publisher, format="some_non_existing_format")
        == api_value_serialization["metadata"]["publisher"]
    )

    non_existing = metadata["non-existing"]
    assert isinstance(non_existing, FieldData)
    assert FieldData.value(non_existing) == ""
    assert FieldData.ui_value(non_existing) == ""
    assert FieldData.label(non_existing) == "Item does not exist"
    assert FieldData.help(non_existing) == "Item does not exist"
    assert FieldData.hint(non_existing) == "Item does not exist"

    non_existing_1_level_deeper = non_existing["non_existing_2"]
    assert isinstance(non_existing, FieldData)
    assert FieldData.value(non_existing_1_level_deeper) == ""
    assert FieldData.ui_value(non_existing_1_level_deeper) == ""

    publication_date = metadata["publication_date"]
    assert isinstance(publication_date, FieldData)
    assert FieldData.value(publication_date) == api_value_serialization["metadata"]["publication_date"]
    if isinstance(publication_date._ui_data, dict):  # noqa: SLF001 private access  # no format specified
        assert FieldData.ui_value(publication_date) == next(
            iter(publication_date._ui_data.values())  # noqa: SLF001 private access  # no format specified
        )
    assert (
        FieldData.ui_value(publication_date, format="l10n_medium")
        == ui_value_serialization["publication_date_l10n_medium"]
    )
    assert (
        FieldData.ui_value(publication_date, format="l10n_long") == ui_value_serialization["publication_date_l10n_long"]
    )
    assert FieldData.label(publication_date) == "metadata/publication_date.label"
    assert FieldData.help(publication_date) == "metadata/publication_date.help"
    assert FieldData.hint(publication_date) == "metadata/publication_date.hint"

    # array call should always return list
    # array call on scalar (one item) -> list with 1 item
    titles_arrays = FieldData.array(title)
    assert isinstance(titles_arrays, list)
    assert len(titles_arrays) == 1
    assert titles_arrays[0] is title  # same object

    creators = metadata["creators"]["creators"]
    # [index in list] will never work, should only use with FieldData.array
    assert creators[0] == EMPTY_FIELD_DATA

    creators_array = FieldData.array(creators)
    assert len(creators_array) > 0
    assert all(isinstance(x, FieldData) for x in creators_array), "Not all items are instances of FieldData"

    creator0 = creators_array[0]
    assert (
        FieldData.value(creator0["person_or_org"]["name"])
        == api_value_serialization["metadata"]["creators"][0]["person_or_org"]["name"]
    )
    assert (
        FieldData.value(creator0["role"]["title"])
        == api_value_serialization["metadata"]["creators"][0]["role"]["title"]
    )
    assert (
        FieldData.ui_value(creator0["role"]["title"])
        == ui_value_serialization["creators"]["creators"][0]["role"]["title"]
    )

    assert (
        FieldData.ui_value(metadata["additional_description"])
        == api_value_serialization["metadata"]["additional_description"]
    )  # fallback to api value
    assert FieldData.ui_value(metadata["description"], format="stripped") == "fotočka"

    creators_affiliations = metadata["creators"]["affiliations"]
    assert isinstance(creators_affiliations, FieldData)
    creators_affiliations_array = FieldData.array(creators_affiliations)
    assert len(creators_affiliations_array) == 0

    # dict(value) when called on array or string returns empty dict
    assert FieldData.dict(title) == {}
    assert FieldData.dict(creators) == {}
    assert FieldData.dict(metadata["resource_type"]).keys() == {"id", "title"}
    assert all(isinstance(x, FieldData) for x in FieldData.dict(metadata["resource_type"]).values()), (
        "Not all items are instances of FieldData"
    )

    id_value = FieldData.dict(metadata["resource_type"])["id"]
    assert FieldData.value(id_value) == api_value_serialization["metadata"]["resource_type"]["id"]
    assert (
        FieldData.ui_value(id_value) == api_value_serialization["metadata"]["resource_type"]["id"]
    )  # fallback to API value
    assert FieldData.label(id_value) == "metadata/resource_type/id.label"

    resource_type_title = FieldData.dict(metadata["resource_type"])["title"]
    assert FieldData.value(resource_type_title) == api_value_serialization["metadata"]["resource_type"]["title"]
    assert (
        FieldData.ui_value(resource_type_title, format="l10n") == ui_value_serialization["resource_type"]["title_l10n"]
    )
    resource_type_title_without_ui_data = resource_type_title
    resource_type_title_without_ui_data._ui_data = {}  # noqa: SLF001 private access

    assert (
        json.loads(FieldData.ui_value(resource_type_title_without_ui_data, format=""))
        == api_value_serialization["metadata"]["resource_type"]["title"]
    )  # no format, fallback to API value

    assert isinstance(record._api_data, dict)  # noqa: SLF001 private access
    assert isinstance(record._ui_data, dict)  # noqa: SLF001 private access
    assert isinstance(
        metadata["creators"]["creators"]._api_data,  # noqa: SLF001 private access
        list,
    )
    assert not isinstance(
        metadata["creators"]["creators"]._api_data[0],  # noqa: SLF001 private access
        FieldData,
    )
    assert (
        metadata["title"]._api_data  # noqa: SLF001 private access
        == api_value_serialization["metadata"]["title"]
    )
    assert (
        non_existing._api_data  # noqa: SLF001 private access
        is EMPTY_FIELD_DATA_SENTINEL
    )
    assert (
        creators_array[0]._ui_data  # noqa: SLF001 private access
        == ui_value_serialization["creators"]["creators"][0]
    )

    # check that FieldData does not modify content of the fields
    # If it was empty string it will return empty string
    # If it was integer 0 it will return 0
    # It was bool False/True  it will return False/True
    # It value was filled then bool(value) returns true
    media_files = record["media_files"]
    assert isinstance(media_files, FieldData)
    assert (
        FieldData.value(media_files["dummy_field_empty_string"]) == ""
    )  # originally was empty string (not filled value)
    assert not bool(media_files["dummy_field_empty_string"])  # it was NOT filled

    assert not FieldData.value(media_files["enabled"])  # originally was False, but it was filled
    assert bool(media_files["enabled"])  # it WAS filled

    assert FieldData.value(media_files["dummy_field"])  # originally was True, but it was filled
    assert bool(media_files["dummy_field"])  # it WAS filled

    assert FieldData.value(media_files["count"]) == 0  # originally was zero, but it was filled
    assert bool(media_files["count"])  # it WAS filled

    assert FieldData.value(media_files["dummy_total_bytes"]) == 123  # originally was some other number
    assert bool(media_files["dummy_total_bytes"])  # it WAS filled

    # It should fall back to API value, but cant modify it either
    assert FieldData.ui_value(media_files["dummy_field_empty_string"]) == ""
    assert FieldData.ui_value(media_files["enabled"]) == "False"
    assert FieldData.ui_value(media_files["dummy_field"])
    assert FieldData.ui_value(media_files["count"]) == "0"
    assert FieldData.ui_value(media_files["dummy_total_bytes"]) == "123"

    assert (
        FieldData.value(media_files["entries"], default="default_value") == {}
    )  # is was empty dictionary originally, so it just return empty dict
    assert FieldData.value(media_files["entries"]) == {}
    assert not bool(media_files["entries"])  # it was NOT filled

    assert (
        FieldData.value(media_files["order"], default="default_value") == []
    )  # is was empty list originally, so it just return empty list
    assert FieldData.value(media_files["order"]) == []
    assert not bool(media_files["order"])  # it was NOT filled

    # again fallback to API values, but we cant modify
    assert FieldData.ui_value(media_files["entries"]) == "{}"
    assert FieldData.ui_value(media_files["entries"], default="default_value") == "{}"
    assert FieldData.ui_value(media_files["entries"], format="some_format", default="default_value") == "{}"

    assert FieldData.ui_value(media_files["order"]) == "[]"
    assert FieldData.ui_value(media_files["order"], default="default_value") == "[]"
    assert FieldData.ui_value(media_files["order"], format="some_format", default="default_value") == "[]"


def test_filter_value(field_data_test_obj):
    api_value_serialization, _, record = field_data_test_obj

    with pytest.raises(TypeError):
        value("certainly not a fielddata obj")

    assert value(record["metadata"]["title"]) == api_value_serialization["metadata"]["title"]


def test_filter_ui_value(field_data_test_obj):
    _, ui_value_serialization, record = field_data_test_obj

    with pytest.raises(TypeError):
        value("certainly not a fielddata obj")

    assert (
        ui_value(record["metadata"]["publication_date"], format="l10n_long")
        == ui_value_serialization["publication_date_l10n_long"]
    )


def test_filter_as_array(field_data_test_obj):
    api_value_serialization, _, record = field_data_test_obj

    with pytest.raises(TypeError):
        value("certainly not a fielddata obj")

    ret = as_array(record["metadata"]["publication_date"])
    assert len(ret) == 1
    assert isinstance(ret[0], FieldData)
    assert FieldData.value(ret[0]) == api_value_serialization["metadata"]["publication_date"]


def test_filter_as_dict(field_data_test_obj):
    api_value_serialization, _, record = field_data_test_obj

    with pytest.raises(TypeError):
        value("certainly not a fielddata obj")

    ret = as_dict(record["metadata"]["custom_fields"])
    assert len(ret) == 0

    ret = as_dict(record["metadata"]["resource_type"])
    assert len(ret.keys()) == len(api_value_serialization["metadata"]["resource_type"])
    assert FieldData.value(ret["id"]) == api_value_serialization["metadata"]["resource_type"]["id"]


def test_filter_empty(field_data_test_obj):
    _, _, record = field_data_test_obj

    with pytest.raises(TypeError):
        value("certainly not a fielddata obj")

    ret = as_dict(record["metadata"]["custom_fields"])
    assert not bool(ret)  # it IS empty or was NOT filled

    ret = as_dict(record["metadata"]["resource_type"])
    assert bool(ret)  # it is NOT empty or it WAS filled


@pytest.mark.parametrize(
    ("values", "language", "expected"),
    [
        # Exact match
        ({"cs": "Název", "en": "Name"}, "cs_CZ", "Název"),
        # Fallback to English if preferred locale missing
        ({"en": "Name"}, "cs_CZ", "Name"),
        # Fallback to any non-und key
        ({"de": "Titel", "und": "Unknown"}, "cs_CZ", "Titel"),
        # Fallback to und if no other value available
        ({"und": "Generic"}, "cs_CZ", "Generic"),
        # Legacy string (not dict)
        ("Just a string", "cs_CZ", "Just a string"),
        # No values given → default fallback
        (None, "cs_CZ", "Item does not exist"),
    ],
)
def test_get_localized_value(app, values, language, expected):
    """Test locale preference and fallback order in _get_localized_value()."""
    app.config["BABEL_DEFAULT_LOCALE"] = language
    with app.app_context():
        result = FieldData._get_localized_value(values, default_fallback="Item does not exist")  # noqa: SLF001
        assert result == expected


def test_get_localized_value_partial_locales(app, monkeypatch):
    """Ensure correct handling when only base locale exists."""
    app.config["BABEL_DEFAULT_LOCALE"] = "fr"
    with app.app_context():
        values = {"fr": "Nom", "en": "Name"}
        assert FieldData._get_localized_value(values) == "Nom"  # noqa: SLF001


def test_get_localized_value_prefers_non_und(app, monkeypatch):
    """Ensure 'und' is only used when nothing else exists."""
    app.config["BABEL_DEFAULT_LOCALE"] = "es"
    with app.app_context():
        values = {"und": "Generic", "en": "Name"}
        assert FieldData._get_localized_value(values) == "Name"  # noqa: SLF001


def test_localized_filter_with_fielddata(field_data_test_obj, app):
    """Test localized filter with FieldData instances."""
    from oarepo_ui.templating.filters import localized

    _, _, record = field_data_test_obj
    resource_type_title = record["metadata"]["resource_type"]["title"]

    # Test with en locale
    app.config["BABEL_DEFAULT_LOCALE"] = "en"
    with app.app_context():
        assert localized(resource_type_title) == "Photo"

    # Test with de locale
    app.config["BABEL_DEFAULT_LOCALE"] = "de"
    with app.app_context():
        assert localized(resource_type_title) == "Foto"

    # Test with sv locale
    app.config["BABEL_DEFAULT_LOCALE"] = "sv"
    with app.app_context():
        assert localized(resource_type_title) == "Foto"

    # Fallback to en if locale not found
    app.config["BABEL_DEFAULT_LOCALE"] = "cs"
    with app.app_context():
        assert localized(resource_type_title) == "Photo"

    # Test with custom default_fallback using empty FieldData
    empty_fd = EMPTY_FIELD_DATA
    app.config["BABEL_DEFAULT_LOCALE"] = "en"
    with app.app_context():
        assert localized(empty_fd, default_fallback="Custom fallback") == "Custom fallback"


def test_localized_filter_type_error():
    """Test localized filter raises TypeError for non-FieldData inputs."""
    from oarepo_ui.templating.filters import localized

    # Test that TypeError is raised for various non-FieldData inputs
    with pytest.raises(TypeError, match="Expected FieldData, got dict"):
        localized({"en": "English"})

    with pytest.raises(TypeError, match="Expected FieldData, got str"):
        localized("Just a string")

    with pytest.raises(TypeError, match="Expected FieldData, got int"):
        localized(42)

    with pytest.raises(TypeError, match="Expected FieldData, got NoneType"):
        localized(None)

    with pytest.raises(TypeError, match="Expected FieldData, got list"):
        localized(["en", "cs"])
