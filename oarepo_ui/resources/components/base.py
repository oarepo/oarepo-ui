#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI resource components base module.

This module provides the base component class for OARepo UI resources,
defining the interface and conventions for resource components that handle
UI-specific functionality like form configuration and data processing.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from flask_principal import Identity
    from invenio_records_resources.services.records.results import RecordItem

    from oarepo_ui.resources.base import UIComponentsResource

    from ..records.config import UIResourceConfig


class UIResourceComponent[T: UIResourceConfig = UIResourceConfig]:
    """Interface for OARepo UI resource components.

    Only the generic methods and their parameters are in this interface, custom resources
    can add their own methods/parameters.

    Component gets the resource instance as a parameter in the constructor and
    can use .config property to access the resource configuration.

    Naming convention for parameters:
        * api_record - the record being displayed, always is an instance of RecordItem
        * record - UI serialization of the record as comes from the ui serializer. A dictionary
        * data - data serialized by the API service serializer. A dictionary
        * empty_data - empty record data, compatible with the API service serializer. A dictionary
    """

    def __init__(self, resource: UIComponentsResource[T]):
        """:param resource: the resource instance"""
        self.resource = resource

    @property
    def config(self) -> T:
        """The UI configuration."""
        return self.resource.config

    def empty_record(self, *, empty_data: dict, **kwargs: Any) -> None:
        """Add custom data to the empty_data dictionary.

        The value in the empty_data is used to render the create form.

        :param empty_data: empty record data
        """

    def fill_jinja_context(self, *, context: dict, **kwargs: Any) -> None:
        """Fill the jinja context with additional variables.

        This method is called from flask/jinja context processor before the template starts rendering.
        You can add your own variables to the context here.

        :param context: the context dictionary that will be merged into the template's context
        """

    def before_ui_detail(
        self,
        *,
        api_record: RecordItem,
        record: dict,
        identity: Identity,
        ui_links: dict,
        extra_context: dict,
        **kwargs: Any,
    ) -> None:
        """Process the data before the detail page is rendered.

        :param api_record: the record being displayed
        :param record: UI serialization of the record
        :param identity: the current user identity
        :param ui_links: UI links for the record, a dictionary of link name -> link url
        :param extra_context: will be passed to the template as the "extra_context" variable
        """

    def before_ui_search(
        self,
        *,
        identity: Identity,
        search_options: dict,
        ui_links: dict,
        extra_context: dict,
        **kwargs: Any,
    ) -> None:
        """Process the data before the search page is rendered.

        Note: search results are fetched via AJAX, so are not available in this method.
        This method just provides the context for the jinjax template of the search page.

        :param identity: the current user identity
        :param search_options: dictionary of search options, containing api_config, identity, overrides.
            It is fed to self.config.search_app_config as **search_options
        :param ui_links: UI links for the search page, a dictionary of link name -> link url
        :param extra_context: will be passed to the template as the "extra_context" variable
        """

    def form_config(  # noqa: PLR0913  too many arguments
        self,
        *,
        api_record: RecordItem,
        record: dict,
        identity: Identity,
        form_config: dict,
        ui_links: dict,
        extra_context: dict,
        **kwargs: Any,
    ) -> None:
        """Process the form configuration.

        This method is called before before_ui_create hook.

        :param api_record: the record being edited. Can be None if creating a new record.
        :param record: UI serialization of the record
        :param identity: the current user identity
        :param form_config: form configuration dictionary
        :param args: query parameters
        :param view_args: view arguments
        :param ui_links: UI links for the create/edit page, a dictionary of link name -> link url
        :param extra_context: will be passed to the template as the "extra_context" variable
        """

    def before_ui_edit(  # noqa: PLR0913  too many arguments
        self,
        *,
        api_record: RecordItem,
        record: dict,
        data: dict,
        identity: Identity,
        form_config: dict,
        ui_links: dict,
        extra_context: dict,
        **kwargs: Any,
    ) -> None:
        """Process the data before the edit page is rendered.

        This method is called after form_config hook.

        :param api_record: the API record being edited
        :param data: data serialized by the API service serializer. This is the serialized record data.
        :param record: UI serialization of the record (localized). The ui data can be used in the edit
                        template to display, for example, the localized record title.
        :param identity: the current user identity
        :param form_config: form configuration dictionary
        :param args: query parameters
        :param view_args: view arguments
        :param ui_links: UI links for the edit page, a dictionary of link name -> link url
        :param extra_context: will be passed to the template as the "extra_context" variable
        """

    def before_ui_create(
        self,
        *,
        data: dict,
        identity: Identity,
        form_config: dict,
        ui_links: dict,
        extra_context: dict,
        **kwargs: Any,
    ) -> None:
        """Process the data before the create page is rendered.

        This method is called before form_config hook.

        :param data: A dictionary with empty data (show just the structure of the record, with values replaced by None)
        :param identity: the current user identity
        :param form_config: form configuration dictionary
        :param args: query parameters
        :param view_args: view arguments
        :param ui_links: UI links for the create page, a dictionary of link name -> link url
        :param extra_context: will be passed to the template as the "extra_context" variable
        """
