import * as React from "react";
import axios from "axios";
import { useEffect, useCallback, useState, useContext, useMemo } from "react";
import { FormConfigContext, FieldDataContext } from "./contexts";
import {
  OARepoDepositApiClient,
  OARepoDepositSerializer,
  OARepoDepositFileApiClient,
} from "../api";
import _get from "lodash/get";
import _set from "lodash/set";
import { useFormikContext, getIn, setIn } from "formik";
import _omit from "lodash/omit";
import _pick from "lodash/pick";
import _isEmpty from "lodash/isEmpty";
import _isObject from "lodash/isObject";
import _debounce from "lodash/debounce";
import _uniqBy from "lodash/uniqBy";
import { i18next } from "@translations/oarepo_ui/i18next";
import { getTitleFromMultilingualObject, relativeUrl } from "../util";
import { decode } from "html-entities";
import sanitizeHtml from "sanitize-html";
import { getValidTagsForEditor } from "@js/oarepo_ui";
import { DEFAULT_SUGGESTION_SIZE } from "./constants";
import { withCancel } from "react-invenio-forms";
import queryString from "query-string";
import { Message } from "semantic-ui-react";

export const extractFEErrorMessages = (obj) => {
  const errorMessages = [];

  const traverse = (obj, parentKey = "") => {
    if (typeof obj === "string") {
      errorMessages.push({ [parentKey]: obj });
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => traverse(item, `${parentKey}.${index}`));
    } else if (typeof obj === "object") {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = parentKey ? `${parentKey}.${key}` : key;
          traverse(obj[key], newKey);
        }
      }
    }
  };

  traverse(obj);

  // Deduplicate error messages based on the keys
  const uniqueErrorMessages = errorMessages.reduce((acc, obj) => {
    const key = Object.keys(obj)[0];
    const found = acc.some((item) => Object.keys(item)[0] === key);
    if (!found) acc.push(obj);
    return acc;
  }, []);
  return uniqueErrorMessages;
};

export const useFormConfig = () => {
  const context = useContext(FormConfigContext);
  if (!context) {
    throw new Error(
      "useFormConfig must be used inside FormConfigContext.Provider"
    );
  }
  return context;
};

export const useFieldData = () => {
  const context = useContext(FieldDataContext);
  if (!context) {
    throw new Error(
      "useFormConfig must be used inside FieldDataContext .Provider"
    );
  }
  return context;
};

export const useDefaultLocale = () => {
  const {
    formConfig: { default_locale },
  } = useFormConfig();

  return { defaultLocale: default_locale };
};

export const useVocabularyOptions = (vocabularyType) => {
  const {
    formConfig: { vocabularies },
  } = useFormConfig();

  return { options: vocabularies[vocabularyType] };
};

export const useConfirmationModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);

  return { isOpen, close, open };
};

export const useFormFieldValue = ({
  subValuesPath,
  defaultValue,
  subValuesUnique = true,
}) => {
  const usedSubValues = (value) =>
    value && typeof Array.isArray(value)
      ? value.map((val) => _get(val, "lang")) || []
      : [];
  const defaultNewValue = (initialVal, usedSubValues = []) =>
    _set(
      { ...initialVal },
      subValuesPath,
      !usedSubValues?.includes(defaultValue) || !subValuesUnique
        ? defaultValue
        : ""
    );

  return { usedSubValues, defaultNewValue };
};

export const useShowEmptyValue = (
  fieldPath,
  defaultNewValue,
  showEmptyValue
) => {
  const { values, setFieldValue } = useFormikContext();
  const currentFieldValue = getIn(values, fieldPath, []);
  useEffect(() => {
    if (!showEmptyValue) return;
    if (!_isEmpty(currentFieldValue)) return;
    if (defaultNewValue === undefined) {
      console.error(
        "Default value for new input must be provided. Field: ",
        fieldPath
      );
      return;
    }
    if (!fieldPath) {
      console.error("Fieldpath must be provided");
      return;
    }
    // to be used with invenio array fields that always push objects and add the __key property
    if (!_isEmpty(defaultNewValue) && _isObject(defaultNewValue)) {
      currentFieldValue.push({
        __key: currentFieldValue.length,
        ...defaultNewValue,
      });
      setFieldValue(fieldPath, currentFieldValue);
    } else if (typeof defaultNewValue === "string") {
      currentFieldValue.push(defaultNewValue);
      setFieldValue(fieldPath, currentFieldValue);
    }
  }, [showEmptyValue, setFieldValue, fieldPath, defaultNewValue]);
};

export const useDepositApiClient = ({
  baseApiClient,
  serializer,
  internalFieldsArray = ["errors"],
  keysToRemove = ["__key"],
} = {}) => {
  const formik = useFormikContext();

  const {
    values,
    validateForm,
    setFieldError,
    setErrors,
    isSubmitting,
    setSubmitting,
    setFormikState,
  } = formik;
  const {
    formConfig: { createUrl },
  } = useFormConfig();

  const recordSerializer = serializer
    ? new serializer(internalFieldsArray, keysToRemove)
    : new OARepoDepositSerializer(internalFieldsArray, keysToRemove);

  const apiClient = baseApiClient
    ? new baseApiClient(createUrl, recordSerializer)
    : new OARepoDepositApiClient(createUrl, recordSerializer);

  async function save (saveWithoutDisplayingValidationErrors = false) {
    let response;
    let errorsObj = {};
    const errorPaths = [];
    setSubmitting(true);
    setErrors({});

    //  purge any existing errors in internal fields before making save action

    const valuesWithoutInternalFields = _omit(values, internalFieldsArray);
    try {
      response = await apiClient.saveOrCreateDraft(valuesWithoutInternalFields);
      // when I am creating a new draft, it saves the response into formik's state, so that I would have access
      // to the draft and draft links in the app. I we don't do that then each time I click on save it will
      // create new draft, as I don't actually refresh the page, so the record from html is still empty. Invenio,
      // solves this by keeping record in the store, but the idea here is to not create some central state,
      // but use formik as some sort of auxiliary state.

      if (!valuesWithoutInternalFields.id) {
        window.history.replaceState(
          undefined,
          "",
          relativeUrl(response.links.edit_html)
        );
      }

      if (!saveWithoutDisplayingValidationErrors && response.errors) {
        for (const error of response.errors) {
          errorsObj = setIn(errorsObj, error.field, error.messages.join(" "));
          errorPaths.push(error.field);
        }
        if (response.errors.length > 0) {
          errorsObj["BEvalidationErrors"] = {
            errors: response.errors,
            errorMessage: i18next.t(
              "Draft saved with validation errors. Fields listed below that failed validation were not saved to the server"
            ),
            errorPaths,
          };
        }

        return false;
      }
      if (!saveWithoutDisplayingValidationErrors)
        errorsObj["successMessage"] = i18next.t("Draft saved successfully.");
      return response;
    } catch (error) {
      // handle 400 errors. Normally, axios would put messages in error.response. But for example
      // offline Error message does not produce a response, so in this way we can display
      // network error message
      errorsObj["httpErrors"] = error?.response?.data?.message ?? error.message;
      return false;
    } finally {
      // put state changing calls together, in order to avoid multiple rerenders during form submit
      setFormikState((prevState) => ({
        ...prevState,
        // it is a little bit problematic that when you save with errors, the server does not actually return in the response
        // the value you filled if it resulted in validation error. It can cause discrepancy between what is shown in the form and actual
        // state in formik so we preserve metadata in this way
        values: {
          ...prevState.values,
          ...{
            ..._omit(response, ["metadata"]),
            ..._pick(values, ["metadata"]),
          },
        },
        errors: errorsObj,
        isSubmitting: false,
      }));
    }
  }

  async function publish ({ validate = false } = {}) {
    // call save and if save returns false, exit
    const saveResult = await save();

    if (!saveResult) {
      setFieldError(
        "BEvalidationErrors.errorMessage",
        i18next.t(
          "Draft was saved but could not be published due to following validation errors"
        )
      );
      return;
    }
    if (validate) {
      // imperative form validation, if fails exit
      const FEvalidationErrors = await validateForm();
      // show also front end validation errors grouped on the top similar to BE validation errors for consistency
      if (!_isEmpty(FEvalidationErrors)) {
        setFieldError("FEvalidationErrors", {
          errors: extractFEErrorMessages(FEvalidationErrors.metadata),
          errorMessage: i18next.t(
            "Draft was saved but could not be published due to following validation errors"
          ),
        });
        return;
      }
    }

    setSubmitting(true);
    let response;
    try {
      response = await apiClient.publishDraft(saveResult);
      // to remove edit url from the history so when you click back you are taken to the main page instead
      // of the page throwin error as the record is already published. TODO: maybe should be search_html that
      // takes to main search app
      window.history.replaceState(null, "", "/");
      window.location.href = response.links.self_html;
      setFieldError(
        "successMessage",
        i18next.t(
          "Draft published successfully. Redirecting to record's detail page ..."
        )
      );

      return response;
    } catch (error) {
      // in case of validation errors on the server during publish, in RDM they return a 400 and below
      // error message. Not 100% sure if our server does the same.
      if (
        error?.response &&
        error.response.data?.status === 400 &&
        error.response.data?.message === "A validation error occurred."
      ) {
        error.errors?.forEach((err) =>
          setFieldError(err.field, err.messages.join(" "))
        );
      } else {
        setFieldError(
          "httpErrors",
          error?.response?.data?.message ?? error.message
        );
      }

      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function read (recordUrl) {
    return await apiClient.readDraft({ self: recordUrl });
  }

  async function _delete (redirectUrl) {
    if (!redirectUrl)
      throw new Error(
        "You must provide url where to be redirected after deleting a draft"
      );
    setSubmitting(true);
    try {
      let response = await apiClient.deleteDraft(values);

      window.location.href = redirectUrl;
      setFieldError(
        "successMessage",
        i18next.t(
          "Draft deleted successfully. Redirecting to the main page ..."
        )
      );
      return response;
    } catch (error) {
      setFieldError(
        "httpErrors",
        error?.response?.data?.message ?? error.message
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function preview () {
    setSubmitting(true);
    try {
      const saveResult = await save();

      if (!saveResult) {
        setFieldError(
          "BEvalidationErrors.errorMessage",
          i18next.t(
            "Your draft was saved. If you wish to preview it, please correct the following validation errors and click preview again:"
          )
        );
        return;
      } else {
        const url = saveResult.links.self_html;
        setFieldError(
          "successMessage",
          i18next.t("Your draft was saved. Redirecting to the preview page...")
        );
        setTimeout(() => {
          setFieldError("successMessage", "");
          window.location.href = url;
        }, 1000);
      }
      return saveResult;
    } catch (error) {
      setFieldError(
        "httpErrors",
        error?.response?.data?.message ?? error.message
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }
  // we return also recordSerializer and apiClient instances, if someone wants to use this hook
  // inside of another hook, they don't have to initialize the instances manually
  return {
    values,
    isSubmitting,
    save,
    publish,
    read,
    _delete,
    preview,
    recordSerializer,
    apiClient,
    createUrl,
    formik,
  };
};

export const useDepositFileApiClient = (baseApiClient) => {
  const formik = useFormikContext();

  const {
    values,
    setFieldValue,
    setValues,
    setFieldError,
    isSubmitting,
    setSubmitting,
  } = formik;

  const apiClient = baseApiClient
    ? new baseApiClient()
    : new OARepoDepositFileApiClient();

  async function read (draft) {
    return await apiClient.readDraftFiles(draft);
  }
  async function _delete (file) {
    setValues(_omit(values, ["errors"]));
    setSubmitting(true);
    try {
      let response = await apiClient.deleteFile(file?.links);
      return Promise.resolve(response);
    } catch (error) {
      setFieldError(
        "httpErrors",
        error?.response?.data?.message ?? error.message
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }
  return {
    values,
    isSubmitting,
    _delete,
    read,
    apiClient,
    formik,
    setFieldValue,
  };
};

export const handleValidateAndBlur = (validateField, setFieldTouched) => {
  return (fieldPath) => {
    setFieldTouched(fieldPath, true);
    validateField(fieldPath);
  };
};

export const useValidateOnBlur = () => {
  const { validateField, setFieldTouched } = useFormikContext();

  return handleValidateAndBlur(validateField, setFieldTouched);
};

export const useSanitizeInput = () => {
  const {
    formConfig: { allowedHtmlAttrs, allowedHtmlTags },
  } = useFormConfig();

  const sanitizeInput = useCallback(
    (htmlString) => {
      const decodedString = decode(htmlString);
      const cleanInput = sanitizeHtml(decodedString, {
        allowedTags: allowedHtmlTags,
        allowedAttributes: allowedHtmlAttrs,
      });
      return cleanInput;
    },
    [allowedHtmlTags, allowedHtmlAttrs]
  );
  const validEditorTags = useMemo(
    () => getValidTagsForEditor(allowedHtmlTags, allowedHtmlAttrs),
    [allowedHtmlTags, allowedHtmlAttrs]
  );
  return {
    sanitizeInput,
    allowedHtmlAttrs,
    allowedHtmlTags,
    validEditorTags,
  };
};

export const useSuggestionApi = ({
  initialSuggestions = [],
  serializeSuggestions = (suggestions) =>
    suggestions.map((item) => ({
      text: getTitleFromMultilingualObject(item.title),
      value: item.id,
      key: item.id,
    })),
  serializeAddedValue,
  debounceTime = 500,
  preSearchChange = (x) => x,
  suggestionAPIUrl,
  suggestionAPIQueryParams = {},
  suggestionAPIHeaders = {},
  searchOnFocus = false,
  searchQueryParamName = "suggest",
  loadingMessage = "Loading...",
  suggestionsErrorMessage = i18next.t("Something went wrong..."),
  noQueryMessage = i18next.t("Search..."),
  noResultsMessage = i18next.t("No results found."),
}) => {
  const _initialSuggestions = initialSuggestions
    ? serializeSuggestions(initialSuggestions)
    : [];

  const _initialState = {
    isFetching: false,
    suggestions: _initialSuggestions,
    error: false,
    searchQuery: null,
    open: false,
  }

  const [state, setState] = React.useState(_initialState);
  const [cancellableAction, setCancellableAction] = React.useState();

  const onSearchChange = React.useCallback(
    _debounce(async (e, { searchQuery }) => {
      cancellableAction && cancellableAction.cancel();
      await executeSearch(searchQuery);
      // eslint-disable-next-line react/destructuring-assignment
    }, debounceTime),
    [cancellableAction, debounceTime]
  );

  const executeSearch = React.useCallback(
    async (searchQuery) => {
      const query = preSearchChange(searchQuery);
      // If there is no query change, then display prevState suggestions
      const { searchQuery: prevSearchQuery } = state;
      if (prevSearchQuery === searchQuery) {
        return;
      }
      setState((prevState) => ({...prevState, isFetching: true, searchQuery: query }));
      try {
        const suggestions = await fetchSuggestions(query);

        const serializedSuggestions = serializeSuggestions(suggestions);
        setState((prevState) => {
          const newSuggestions = [...serializedSuggestions]

          return {
            ...prevState,
            suggestions: _uniqBy(newSuggestions, "value"),
            isFetching: false,
            error: false,
            open: true,
          };
        });
      } catch (e) {
        console.error(e);
        setState((prevState) => ({
          ...prevState,
          error: true,
          isFetching: false,
        }));
      }
    },
    [cancellableAction, preSearchChange, serializeSuggestions]
  );

  const fetchSuggestions = React.useCallback(
    async (searchQuery) => {
      const _cancellableFetch = withCancel(
        axios.get(suggestionAPIUrl, {
          params: {
            [searchQueryParamName]: searchQuery,
            size: DEFAULT_SUGGESTION_SIZE,
            ...suggestionAPIQueryParams,
          },
          headers: suggestionAPIHeaders,
          // There is a bug in axios that prevents brackets from being encoded,
          // remove the paramsSerializer when fixed.
          // https://github.com/axios/axios/issues/3316
          paramsSerializer: (params) =>
            queryString.stringify(params, { arrayFormat: "repeat" }),
        })
      );
      setCancellableAction(_cancellableFetch);

      try {
        const response = await _cancellableFetch.promise;
        return response?.data?.hits?.hits;
      } catch (e) {
        console.error(e);
      }
    },
    [
      suggestionAPIUrl,
      searchQueryParamName,
      suggestionAPIQueryParams,
      suggestionAPIHeaders,
    ]
  );

  const getNoResultsMessage = React.useCallback(() => {
    const { isFetching, error, searchQuery } = state;
    if (isFetching) {
      return loadingMessage;
    }
    if (error) {
      return <Message negative size="mini" content={suggestionsErrorMessage} />;
    }
    if (!searchQuery) {
      return noQueryMessage;
    }
    return noResultsMessage;
  }, [
    loadingMessage,
    noQueryMessage,
    noResultsMessage,
    suggestionsErrorMessage,
  ]);

  const onClose = React.useCallback(() => {
    setState((prevState) => ({ ...prevState, open: false }));
  }, []);

  const onBlur = React.useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      open: false,
      error: false,
      searchQuery: searchOnFocus ? prevState.searchQuery : null,
      suggestions: searchOnFocus
        ? prevState.suggestions
        : prevState.selectedSuggestions,
    }));
  }, [searchOnFocus]);

  const onFocus = React.useCallback(async () => {
    setState((prevState) => ({ ...prevState, open: true }));
    if (searchOnFocus) {
      const { searchQuery } = state;
      await executeSearch(searchQuery || "");
    }
  }, [searchOnFocus]);

  return {
    ...state,
    fetchSuggestions,
    executeSearch,
    onSearchChange,
    getNoResultsMessage,
    onClose,
    onBlur,
    onFocus,
  };
};

export default useSanitizeInput;
