from typing import TYPE_CHECKING, Dict

from flask_principal import Identity
from invenio_records_resources.services.records.results import RecordItem

if TYPE_CHECKING:
    from oarepo_ui.resources import UIResource


class UIResourceComponent:
    """
    Only the currently used methods and their parameters are in this interface.
    Custom resources can add their own methods/parameters.

    You are free to base your implementation on this class or base it directly on ServiceComponent.

    Component gets the resource instance as a parameter in the constructor and can use .config property to access
    the resource configuration.

    Naming convention for parameters:
        * api_record - the record being displayed, always is an instance of RecordItem
        * record - UI serialization of the record as comes from the ui serializer. A dictionary
        * data - data serialized by the API service serializer. A dictionary
        * empty_data - empty record data, compatible with the API service serializer. A dictionary
    """

    def __init__(self, resource: "UIResource"):
        """
        :param resource: the resource instance
        """
        self.resource = resource

    @property
    def config(self):
        """The UI configuration."""
        return self.resource.config

    def empty_record(self, *, resource_requestctx, empty_data: Dict, **kwargs):
        """
        Called before an empty record data are returned.

        :param resource_requestctx: invenio request context (see https://github.com/inveniosoftware/flask-resources/blob/master/flask_resources/context.py)
        :param empty_data: empty record data
        """

    def fill_jinja_context(self, *, context: Dict, **kwargs):
        """This method is called from flask/jinja context processor before the template starts rendering.
           You can add your own variables to the context here.

        :param context: the context dictionary that will be merged into the template's context
        """

    def before_ui_detail(
        self,
        *,
        api_record: RecordItem,
        record: Dict,
        identity: Identity,
        args: Dict,
        view_args: Dict,
        ui_links: Dict,
        extra_context: Dict,
        **kwargs,
    ):
        """
        Called before the detail page is rendered.

        :param api_record: the record being displayed
        :param record: UI serialization of the record
        :param identity: the current user identity
        :param args: query parameters
        :param view_args: view arguments
        :param ui_links: UI links for the record, a dictionary of link name -> link url
        :param extra_context: will be passed to the template as the "extra_context" variable
        """

    def before_ui_search(
        self,
        *,
        identity: Identity,
        search_options: Dict,
        args: Dict,
        view_args: Dict,
        ui_links: Dict,
        extra_context: Dict,
        **kwargs,
    ):
        """
        Called before the search page is rendered.
        Note: search results are fetched via AJAX, so are not available in this method.
        This method just provides the context for the jinjax template of the search page.

        :param identity: the current user identity
        :param search_options: dictionary of search options, containing api_config, identity, overrides.
            It is fed to self.config.search_app_config as **search_options
        :param args: query parameters
        :param view_args: view arguments
        :param ui_links: UI links for the search page, a dictionary of link name -> link url
        :param extra_context: will be passed to the template as the "extra_context" variable
        """

    def form_config(
        self,
        *,
        api_record: RecordItem,
        record: Dict,
        data: Dict,
        identity: Identity,
        form_config: Dict,
        args: Dict,
        view_args: Dict,
        ui_links: Dict,
        extra_context: Dict,
        **kwargs,
    ):
        """
        Called to fill form_config for the create/edit page.

        :param api_record: the record being edited. Can be None if creating a new record.
        :param record: UI serialization of the record
        :param data: data serialized by the API service serializer. If a record is being edited,
                     this is the serialized record data. If a new record is being created, this is empty_data
                     after being processed by the empty_record method on registered UI components.
        :param identity: the current user identity
        :param form_config: form configuration dictionary
        :param args: query parameters
        :param view_args: view arguments
        :param ui_links: UI links for the create/edit page, a dictionary of link name -> link url
        :param extra_context: will be passed to the template as the "extra_context" variable
        """

    def before_ui_edit(
        self,
        *,
        api_record: RecordItem,
        record: Dict,
        data: Dict,
        identity: Identity,
        form_config: Dict,
        args: Dict,
        view_args: Dict,
        ui_links: Dict,
        extra_context: Dict,
        **kwargs,
    ):
        """
        Called before the edit page is rendered, after form_config has been filled.

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
        data: Dict,
        identity: Identity,
        form_config: Dict,
        args: Dict,
        view_args: Dict,
        ui_links: Dict,
        extra_context: Dict,
        **kwargs,
    ):
        """
        Called before the create page is rendered, after form_config has been filled

        :param data: A dictionary with empty data (show just the structure of the record, with values replaced by None)
        :param identity: the current user identity
        :param form_config: form configuration dictionary
        :param args: query parameters
        :param view_args: view arguments
        :param ui_links: UI links for the create page, a dictionary of link name -> link url
        :param extra_context: will be passed to the template as the "extra_context" variable
        """
