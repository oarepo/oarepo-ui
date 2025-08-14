import _cloneDeep from "lodash/cloneDeep";
import _get from "lodash/get";
import _isEmpty from "lodash/isEmpty";
import { applyMiddleware, compose, createStore, combineReducers } from "redux";
import thunk from "redux-thunk";
import fileReducer, {
  UploadState,
} from "@js/invenio_rdm_records/src/deposit/state/reducers/files";
import depositReducer from "@js/invenio_rdm_records/src/deposit/state/reducers/deposit";
import { decodeUnicodeBase64 } from "../util";
import { DRAFT_HAS_VALIDATION_ERRORS } from "@js/invenio_rdm_records/src/deposit/state/types";

function createOverridenReducer(baseReducer, override = null) {
  return (state, action) => {
    if (override) {
      const result = override(state, action);
      if (typeof result !== "undefined") {
        return result;
      }
    }
    return baseReducer(state, action);
  };
}

const preloadFiles = (files) => {
  const _files = _cloneDeep(files);
  return {
    links: files.links || {},
    entries: _get(_files, "entries", [])
      .map((file) => {
        const fileState = {
          file_id: file.file_id,
          name: file.key,
          key: file.key,
          size: file.size || 0,
          checksum: file.checksum || "",
          links: file.links || {},
          mimetype: file.mimetype || "application/octet-stream",
          status: UploadState[file.status] || file.status,
        };

        return {
          progressPercentage:
            fileState.status === UploadState.completed ? 100 : 0,
          ...fileState,
        };
      })
      .reduce((acc, current) => {
        acc[current.name] = { ...current };
        return acc;
      }, {}),
  };
};

export function configureStore(
  appConfig,
  overridenDepositReducer,
  overridenFilesReducer
) {
  const {
    record,
    errors,
    preselectedCommunity,
    files,
    config,
    permissions,
    ...extra
  } = appConfig;

  const urlHash = window.location.hash.substring(1);
  let errorData;
  if (urlHash) {
    const decodedData = decodeUnicodeBase64(urlHash);
    errorData = JSON.parse(decodedData);
    window.history.replaceState(
      null,
      null,
      window.location.pathname + window.location.search
    );
  }

  const calculatedErrors =
    errorData?.errors?.length > 0
      ? extra.recordSerializer.deserializeErrors(errorData.errors)
      : errors || {};
  const initialDepositState = {
    record,
    errors: calculatedErrors,
    config,
    permissions,
    actionState: !_isEmpty(calculatedErrors)
      ? DRAFT_HAS_VALIDATION_ERRORS
      : null,
    actionStateExtra: {},
    formFeedbackMessage: errorData?.errorMessage || "",
  };

  const preloadedState = {
    deposit: initialDepositState,
    files: preloadFiles(files || {}),
  };

  const rootReducer = combineReducers({
    deposit: createOverridenReducer(depositReducer, overridenDepositReducer),
    files: createOverridenReducer(fileReducer, overridenFilesReducer),
  });

  const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  return createStore(
    rootReducer,
    preloadedState,
    composeEnhancers(
      applyMiddleware(thunk.withExtraArgument({ config, ...extra }))
    )
  );
}
