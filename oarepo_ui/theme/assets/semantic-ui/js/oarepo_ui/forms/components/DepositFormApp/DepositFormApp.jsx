import React, { Component } from "react";
import {
  FormConfigProvider,
  FieldDataProvider,
  InitialRecordProvider,
  ValidationScopeProvider,
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
import _set from "lodash/set";
import { depositReducer as oarepoDepositReducer } from "../../state/deposit/reducers";
import { rdmDepositValidationSchema } from "../../validationSchemas";
import { severityChecksConfig } from "@js/invenio_app_rdm/deposit/config";
// import { DepositBootstrap } from "@js/invenio_rdm_records/src/deposit/api/DepositBootstrap";
import { DepositBootstrap } from "../DepositBootstrap";

const queryClient = new QueryClient();

export class DepositFormApp extends Component {
  constructor(props) {
    super(props);
    this.overridableIdPrefix = props.config.overridableIdPrefix;
    this.sections = props.sections || [];

    // Validation scope - stores current paths to validate (ref equivalent)
    this.validationScopePaths = [];
    this.setValidationScope = this.setValidationScope.bind(this);
    this.validate = this.validate.bind(this);
    const recordSerializer = props.recordSerializer
      ? props.recordSerializer
      : new RDMDepositRecordSerializer(
          props.config.default_locale,
          props.config.custom_fields.vocabularies,
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

    const severityChecks = props.severityChecks ?? severityChecksConfig;

    const apiClient =
      props.apiClient ||
      new RDMDepositApiClient(
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
      props.draftsService || new RDMDepositDraftsService(apiClient);

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
      preselectedCommunity: props.preselectedCommunity,
      files: props.files,
      apiClient: apiClient,
      fileApiClient: fileApiClient,
      service: service,
      permissions: props.config.permissions,
      recordSerializer: recordSerializer,
    };

    this.config = props.config;
    this.initialRecordContextValue = { initialRecord: props.record };

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

    this.validationScopeContextValue = {
      setValidationScope: this.setValidationScope,
    };
  }

  setValidationScope(paths) {
    this.validationScopePaths = paths;
  }

  pickSchemaByPaths(schema, paths) {
    if (!paths || paths.length === 0 || !schema) return schema;
    if (!schema.pick) return schema;

    // Group paths by top-level key
    // e.g., ["metadata.title", "metadata.creators", "access"] =>
    // { metadata: ["title", "creators"], access: null }
    const grouped = {};
    for (const path of paths) {
      const [topLevel, ...rest] = path.split(".");
      if (!grouped[topLevel]) {
        grouped[topLevel] = [];
      }
      if (rest.length > 0 && grouped[topLevel] !== null) {
        grouped[topLevel].push(rest.join("."));
      } else {
        // No nested path means keep entire sub-schema
        grouped[topLevel] = null;
      }
    }

    // Pick top-level keys
    const topLevelKeys = Object.keys(grouped);
    let result = schema.pick(topLevelKeys);

    // Recursively pick nested fields
    for (const key of topLevelKeys) {
      const nestedPaths = grouped[key];
      if (
        nestedPaths !== null &&
        nestedPaths.length > 0 &&
        schema.fields?.[key]?.pick
      ) {
        const pickedNested = this.pickSchemaByPaths(
          schema.fields[key],
          nestedPaths,
        );
        result = result.shape({ [key]: pickedNested });
      }
    }

    return result;
  }

  validate(values) {
    const { validationSchema } = this.props;
    if (!validationSchema) return {};

    const paths = this.validationScopePaths;
    const schemaToValidate =
      paths && paths.length > 0
        ? this.pickSchemaByPaths(validationSchema, paths)
        : validationSchema;

    try {
      schemaToValidate.validateSync(values, { abortEarly: false });
      return {};
    } catch (err) {
      if (err.inner) {
        return err.inner.reduce((acc, error) => {
          if (error.path) {
            _set(acc, error.path, error.message);
          }
          return acc;
        }, {});
      }
      return {};
    }
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
      sections,
      useWizardForm,
      validationSchema,
      formikConfig = validationSchema ? { validate: this.validate } : {},
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
                  <InitialRecordProvider value={this.initialRecordContextValue}>
                    <ValidationScopeProvider
                      value={this.validationScopeContextValue}
                    >
                      <FieldDataProvider>
                        <Overridable
                          id={buildUID(
                            this.overridableIdPrefix,
                            "FormApp.layout",
                          )}
                        >
                          <Container className="rel-mt-1">
                            <DepositBootstrap formikConfig={formikConfig}>
                              <BaseFormLayout
                                sections={sections}
                                record={record}
                                useWizardForm={useWizardForm}
                              />
                            </DepositBootstrap>
                          </Container>
                        </Overridable>
                      </FieldDataProvider>
                    </ValidationScopeProvider>
                  </InitialRecordProvider>
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
  useWizardForm: PropTypes.bool,
  validationSchema: PropTypes.object,
  formikConfig: PropTypes.object,
};

DepositFormApp.defaultProps = {
  useWizardForm: false,
  // validationSchema: rdmDepositValidationSchema,
};
