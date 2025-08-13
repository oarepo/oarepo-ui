import React, { Component } from "react";
import {
  FormConfigProvider,
  FieldDataProvider,
  FormikRefProvider,
} from "../../contexts";
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
} from "@js/invenio_rdm_records/src/deposit/api/DepositApiClient";
import { RDMDepositRecordSerializer } from "@js/invenio_rdm_records/src/deposit/api/DepositRecordSerializer";
import { RDMDepositDraftsService } from "@js/invenio_rdm_records/src/deposit/api/DepositDraftsService";
import { RDMDepositFilesService } from "@js/invenio_rdm_records/src/deposit/api/DepositFilesService";
import { DepositService } from "@js/invenio_rdm_records/src/deposit/api/DepositService";
import { RDMUploadProgressNotifier } from "@js/invenio_rdm_records/src/deposit//components/UploadProgressNotifier";
import { configureStore } from "../../store";
import PropTypes from "prop-types";
import { depositReducer as oarepoDepositReducer } from "../../state/deposit/reducers";

const queryClient = new QueryClient();

export class DepositFormApp extends Component {
  constructor(props) {
    super(props);
    this.overridableIdPrefix = props.config.overridableIdPrefix;

    const recordSerializer = props.recordSerializer
      ? props.recordSerializer
      : new RDMDepositRecordSerializer(
          props.config.default_locale,
          props.config.custom_fields.vocabularies
        );

    const apiHeaders = props.apiHeaders
      ? props.apiHeaders
      : {
          "vnd+json": {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        };

    const additionalApiConfig = { headers: apiHeaders };

    const apiClient =
      props.apiClient ||
      new RDMDepositApiClient(
        additionalApiConfig,
        props.config.createUrl,
        recordSerializer
      );

    const fileApiClient =
      props.fileApiClient ||
      new RDMDepositFileApiClient(
        additionalApiConfig,
        props.config.default_transfer_type,
        props.config.enabled_transfer_types
      );

    const draftsService =
      props.draftsService || new RDMDepositDraftsService(apiClient);

    const filesService =
      props.filesService ||
      new RDMDepositFilesService(
        fileApiClient,
        props.config.fileUploadConcurrency
      );

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
        props.record.errors
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
    const { ContainerComponent = null } = this.props;
    const Wrapper = ContainerComponent || React.Fragment;

    return (
      <Wrapper>
        <FormikRefProvider>
          <Provider store={this.store}>
            <QueryClientProvider client={queryClient}>
              <Router>
                <OverridableContext.Provider
                  value={this.overridableContextValue}
                >
                  <FormConfigProvider value={this.config}>
                    <FieldDataProvider>
                      <Overridable
                        id={buildUID(
                          this.overridableIdPrefix,
                          "FormApp.layout"
                        )}
                      >
                        <Container fluid>
                          <BaseFormLayout />
                        </Container>
                      </Overridable>
                    </FieldDataProvider>
                  </FormConfigProvider>
                </OverridableContext.Provider>
              </Router>
            </QueryClientProvider>
          </Provider>
        </FormikRefProvider>
      </Wrapper>
    );
  }
}

DepositFormApp.propTypes = {
  config: PropTypes.object.isRequired,
  /* eslint-disable react/require-default-props */
  apiHeaders: PropTypes.object,
  record: PropTypes.object,
  files: PropTypes.object,
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
