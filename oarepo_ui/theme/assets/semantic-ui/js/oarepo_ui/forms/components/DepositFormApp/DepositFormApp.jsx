import React, { Component } from "react";
import { FormConfigProvider, FieldDataProvider } from "../../contexts";
import { Container } from "semantic-ui-react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { buildUID } from "react-searchkit";
import Overridable, {
  OverridableContext,
  overrideStore,
} from "react-overridable";
import { BaseFormLayout } from "../BaseFormLayout";
import { Provider } from "react-redux";
import {
  RDMDepositApiClient,
  RDMDepositFileApiClient,
  DepositApiClientResponse,
} from "@js/invenio_rdm_records/src/deposit/api/DepositApiClient";
import { RDMDepositRecordSerializer } from "@js/invenio_rdm_records/src/deposit/api/DepositRecordSerializer";
import { RDMDepositDraftsService } from "@js/invenio_rdm_records/src/deposit/api/DepositDraftsService";
import { RDMDepositFilesService } from "@js/invenio_rdm_records/src/deposit/api/DepositFilesService";
import { DepositService } from "@js/invenio_rdm_records/src/deposit/api/DepositService";
import { RDMUploadProgressNotifier } from "@js/invenio_rdm_records/src/deposit//components/UploadProgressNotifier";
import { configureStore } from "../../store";
import PropTypes from "prop-types";
import { depositReducer as oarepoDepositReducer } from "../../state/deposit/reducers";
import _isEmpty from "lodash/isEmpty";
import { severityChecksConfig } from "@js/invenio_app_rdm/deposit/config";

class OArepoDepositDraftsService extends RDMDepositDraftsService {
  async create(draft, params) {
    return this.apiClient.createDraft(draft, params);
  }

  async save(draft, params) {
    return this._draftAlreadyCreated(draft)
      ? this.apiClient.saveDraft(draft, draft.links, params)
      : this.create(draft, params);
  }
}

class OArepoDepositApiClient extends RDMDepositApiClient {
  async _createResponse(axiosRequest) {
    try {
      const response = await axiosRequest();
      const data = this.recordSerializer.deserialize(response.data || {});
      const errors = this.recordSerializer.deserializeErrors(
        response?.data?.errors || [],
      );
      return new DepositApiClientResponse(data, errors);
    } catch (error) {
      // throw specific cancellation error so that it can be handled differently
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
        throw error;
      } else {
        let errorData = error.response.data;
        const errors = this.recordSerializer.deserializeErrors(
          error.response.data.errors || [],
        );
        // this is to serialize raised error from the backend on publish
        if (!_isEmpty(errors)) errorData = errors;
        throw new DepositApiClientResponse({}, errorData);
      }
    }
  }

  async createDraft(draft, { signal } = {}) {
    const payload = this.recordSerializer.serialize(draft);
    return this._createResponse(() =>
      this.axiosWithConfig.post(this.createDraftURL, payload, {
        params: { expand: 1 },
        signal,
      }),
    );
  }

  async saveDraft(draft, draftLinks, { signal } = {}) {
    const payload = this.recordSerializer.serialize(draft);
    return this._createResponse(() =>
      this.axiosWithConfig.put(draftLinks.self, payload, {
        params: { expand: 1 },
        signal,
      }),
    );
  }
}

const queryClient = new QueryClient();

export class DepositFormApp extends Component {
  constructor(props) {
    super(props);
    this.overridableIdPrefix = props.config.overridableIdPrefix;
    this.sections = props.sections || [];
    const recordSerializer = props.recordSerializer
      ? props.recordSerializer
      : new RDMDepositRecordSerializer(
          props.config.default_locale,
          props.config.custom_fields.vocabularies,
        );
    // TODO: switch to vnd accept header, in order to receive UI serialization in API responses in the form
    // not possible to do currently, as our files service needs to be modified https://linear.app/ducesnet/issue/BE-1011/files-service
    const apiHeaders = props.apiHeaders
      ? props.apiHeaders
      : {
          "vnd+json": {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        };

    const additionalApiConfig = { headers: apiHeaders };

    const severityChecks = props.severityChecks ?? severityChecksConfig;

    const apiClient =
      props.apiClient ||
      new OArepoDepositApiClient(
        additionalApiConfig,
        props.config.createUrl,
        recordSerializer,
      );

    const fileApiClient =
      props.fileApiClient ||
      new RDMDepositFileApiClient(
        additionalApiConfig,
        props.config.default_transfer_type,
        props.config.enabled_transfer_types,
      );

    const draftsService =
      props.draftsService || new OArepoDepositDraftsService(apiClient);

    const filesService =
      props.filesService ||
      new RDMDepositFilesService(
        fileApiClient,
        props.config.fileUploadConcurrency,
      );

    props.config.severityChecks = severityChecks;

    const service =
      props.depositService || new DepositService(draftsService, filesService);
    const appConfig = props.appConfig || {
      config: props.config,
      record: recordSerializer.deserialize(props.record),
      preselectedCommunity: props.config.preselected_community,
      files: props.files,
      apiClient: apiClient,
      fileApiClient: fileApiClient,
      service: service,
      permissions: props.config.permissions,
      recordSerializer: recordSerializer,
    };

    this.config = props.config;

    if (props?.record?.errors && props?.record?.errors.length > 0) {
      appConfig.errors = recordSerializer.deserializeErrors(
        props.record.errors,
      );
    }

    const depositReducer = props.depositReducer || oarepoDepositReducer;
    const filesReducer = props.filesReducer || undefined;

    this.store = props.configureStore
      ? props.configureStore(appConfig)
      : configureStore(appConfig, depositReducer, filesReducer);

    const progressNotifier = new RDMUploadProgressNotifier(this.store.dispatch);
    filesService.setProgressNotifier(progressNotifier);

    this.overridableContextValue = {
      ...props.componentOverrides,
      ...overrideStore.getAll(),
    };
  }

  render() {
    const {
      ContainerComponent = null,
      record,
      preselectedCommunity,
      files,
      permissions,
      filesLocked,
      recordRestrictionGracePeriod,
      allowRecordRestriction,
      recordDeletion,
      groupsEnabled,
      allowEmptyFiles,
      useUppy,
    } = this.props;

    const Wrapper = ContainerComponent || React.Fragment;
    return (
      <Wrapper>
        <Provider store={this.store}>
          <QueryClientProvider client={queryClient}>
            <Router>
              <OverridableContext.Provider value={this.overridableContextValue}>
                <FormConfigProvider
                  value={{
                    config: this.config,
                    overridableIdPrefix: this.overridableIdPrefix,
                    record,
                    preselectedCommunity,
                    files,
                    permissions,
                    filesLocked,
                    recordRestrictionGracePeriod,
                    allowRecordRestriction,
                    recordDeletion,
                    groupsEnabled,
                    allowEmptyFiles,
                    useUppy,
                  }}
                >
                  <FieldDataProvider>
                    <Overridable
                      id={buildUID(this.overridableIdPrefix, "FormApp.layout")}
                    >
                      <Container className="rel-mt-1">
                        <DepositBootstrap>
                          <BaseFormLayout record={record} />
                        </DepositBootstrap>
                      </Container>
                    </Overridable>
                  </FieldDataProvider>
                </FormConfigProvider>
              </OverridableContext.Provider>
            </Router>
          </QueryClientProvider>
        </Provider>
      </Wrapper>
    );
  }
}

DepositFormApp.propTypes = {
  config: PropTypes.object.isRequired,
  record: PropTypes.object.isRequired,
  preselectedCommunity: PropTypes.object,
  files: PropTypes.object,
  permissions: PropTypes.object,
  filesLocked: PropTypes.bool,
  recordRestrictionGracePeriod: PropTypes.number.isRequired,
  allowRecordRestriction: PropTypes.bool.isRequired,
  recordDeletion: PropTypes.object.isRequired,
  groupsEnabled: PropTypes.bool.isRequired,
  allowEmptyFiles: PropTypes.bool,
  useUppy: PropTypes.bool,
  /* eslint-disable react/require-default-props */
  severityChecks: PropTypes.object,
  sections: PropTypes.arrayOf(PropTypes.object),
  apiHeaders: PropTypes.object,
  errors: PropTypes.arrayOf(PropTypes.object),
  apiClient: PropTypes.object,
  fileApiClient: PropTypes.object,
  draftsService: PropTypes.object,
  filesService: PropTypes.object,
  depositService: PropTypes.object,
  recordSerializer: PropTypes.object,
  appConfig: PropTypes.object,
  configureStore: PropTypes.func,
  depositReducer: PropTypes.func,
  filesReducer: PropTypes.func,
  ContainerComponent: PropTypes.elementType,
  componentOverrides: PropTypes.object,
};
