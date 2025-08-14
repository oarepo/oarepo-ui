import * as React from "react";
import axios from "axios";
import {
  useEffect,
  useCallback,
  useState,
  useContext,
  useMemo,
  useRef,
} from "react";
import {
  FormConfigContext,
  FieldDataContext,
  FormikRefContext,
} from "./contexts";
import _get from "lodash/get";
import _set from "lodash/set";
import { useFormikContext } from "formik";
import _debounce from "lodash/debounce";
import _uniqBy from "lodash/uniqBy";
import { getTitleFromMultilingualObject } from "../util";
import { decode } from "html-entities";
import sanitizeHtml from "sanitize-html";
import { getValidTagsForEditor } from "./util";
import { DEFAULT_SUGGESTION_SIZE } from "./constants";
import queryString from "query-string";

export const useDepositFormAction = ({ action, params }) => {
  const isMounted = useRef(null);
  const { values, isSubmitting, setSubmitting } = useFormikContext();
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAction = async () => {
    if (!isMounted.current) return;
    setSubmitting(true);
    try {
      await action(values, params);
    } catch (error) {
      console.error("Error occurred while performing action:", error);
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  return { handleAction, isSubmitting };
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

export const useFormikRef = () => {
  const context = useContext(FormikRefContext);
  if (!context) {
    throw new Error(
      "useFormikRef must be used inside FormikRefContext.Provider"
    );
  }
  return context;
};

export const useFieldData = () => {
  const context = useContext(FieldDataContext);
  if (!context) {
    throw new Error(
      "useFormConfig must be used inside FieldDataContext.Provider"
    );
  }
  return context;
};

export const useDefaultLocale = () => {
  const { default_locale: defaultLocale } = useFormConfig();

  return { defaultLocale };
};

export const useConfirmationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMounted = useRef(null);
  isMounted.current = true;

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const close = useCallback(() => {
    if (!isMounted.current) return;
    setIsOpen(false);
  }, []);
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
  const { allowedHtmlAttrs, allowedHtmlTags } = useFormConfig();

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
  debounceTime = 500,
  preSearchChange = (x) => x,
  suggestionAPIUrl,
  suggestionAPIQueryParams = {},
  suggestionAPIHeaders = {},
  searchQueryParamName = "suggest",
}) => {
  const _initialSuggestions = initialSuggestions
    ? serializeSuggestions(initialSuggestions)
    : [];

  const [suggestions, setSuggestions] = useState(_initialSuggestions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noResults, setNoResults] = useState(false);
  const [query, setQuery] = useState("");
  // Inspired by: https://dev.to/alexdrocks/using-lodash-debounce-with-react-hooks-for-an-async-data-fetching-input-2p4g
  const [didMount, setDidMount] = useState(false);

  const fetchSuggestions = React.useCallback(
    (cancelToken) => {
      setLoading(true);
      setNoResults(false);
      setSuggestions(initialSuggestions);
      setError(null);

      axios
        .get(suggestionAPIUrl, {
          params: {
            [searchQueryParamName]: query,
            size: DEFAULT_SUGGESTION_SIZE,
            ...suggestionAPIQueryParams,
          },
          headers: suggestionAPIHeaders,
          cancelToken: cancelToken.token,
          // There is a bug in axios that prevents brackets from being encoded,
          // remove the paramsSerializer when fixed.
          // https://github.com/axios/axios/issues/3316
          paramsSerializer: (params) =>
            queryString.stringify(params, { arrayFormat: "repeat" }),
        })
        .then((res) => {
          const searchHits = res?.data?.hits?.hits;
          if (searchHits.length === 0) {
            setNoResults(true);
          }

          const serializedSuggestions = serializeSuggestions(searchHits);
          setSuggestions(_uniqBy(serializedSuggestions, "value"));
        })
        .catch((err) => {
          setError(err);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [
      initialSuggestions,
      query,
      searchQueryParamName,
      serializeSuggestions,
      suggestionAPIHeaders,
      suggestionAPIQueryParams,
      suggestionAPIUrl,
    ]
  );

  const debouncedSearch = useMemo(
    () =>
      _debounce((cancelToken) => fetchSuggestions(cancelToken), debounceTime),
    [debounceTime, fetchSuggestions]
  );

  useEffect(() => {
    return () => {
      // Make sure to stop the invocation of the debounced function after unmounting
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  React.useEffect(() => {
    if (!didMount) {
      // required to not call Suggestion API on initial render
      setDidMount(true);
      return;
    }

    const cancelToken = axios.CancelToken.source();
    debouncedSearch(cancelToken);

    return () => {
      cancelToken.cancel();
    };
  }, [
    query,
    suggestionAPIUrl,
    searchQueryParamName,
    didMount,
    debouncedSearch,
  ]);

  const executeSearch = React.useCallback(
    (searchQuery) => {
      const newQuery = preSearchChange(searchQuery);
      // If there is no query change, then keep prevState suggestions
      if (query === newQuery) {
        return;
      }

      setQuery(newQuery);
    },
    [preSearchChange, query]
  );

  return {
    suggestions,
    error,
    loading,
    query,
    noResults,
    executeSearch,
  };
};

export default useSanitizeInput;
