import * as React from "react";
import { useSanitizeInput, useFieldData } from "../../hooks";
import { LanguageSelectField } from "../LanguageSelectField";
import { TextField, GroupField } from "react-invenio-forms";
import PropTypes from "prop-types";
import { useFormikContext, getIn } from "formik";
import { LanguagesField } from "@js/invenio_rdm_records";
import { RemoteSelectField } from "./RemoteSelectField";

const serializer = (suggestions) =>
  suggestions.map((item) => ({
    text: item.title_l10n,
    value: item.id,
    key: item.id,
  }));

export const I18nTextInputField = ({
  fieldPath,
  optimized = true,
  lngFieldWidth = 3,
  usedLanguages = [],
  ...uiProps
}) => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext();

  const { getFieldData } = useFieldData();
  const { sanitizeInput } = useSanitizeInput();
  const lngFieldPath = `${fieldPath}.lang`;
  const textFieldPath = `${fieldPath}.value`;
  const lngfielddata = getFieldData({
    fieldPath: lngFieldPath,
    icon: "globe",
    fieldRepresentation: "text",
  });
  console.log("LANG DATA", lngfielddata);
  return (
    <GroupField fieldPath={fieldPath} optimized={optimized}>
      <RemoteSelectField
        key={lngFieldPath}
        serializeSuggestions={(suggestions) =>
          suggestions.map((item) => ({
            text: item.title_l10n,
            value: item.id,
            key: item.id,
          }))
        }
        suggestionAPIUrl="/api/vocabularies/languages"
        suggestionAPIHeaders={{
          Accept: "application/vnd.inveniordm.v1+json",
        }}
        fieldPath={lngFieldPath}
        multiple={false}
        labelIcon={null}
        clearable
        selectOnBlur={false}
        width={5}
        {...getFieldData({
          fieldPath: lngFieldPath,
          icon: "globe",
          fieldRepresentation: "text",
        })}
      />
      {/* <LanguageSelectField
        fieldPath={lngFieldPath}
        width={lngFieldWidth}
        usedLanguages={usedLanguages}
        {...getFieldData({
          fieldPath: lngFieldPath,
          icon: "globe",
          fieldRepresentation: "compact",
        })}
      /> */}
      <TextField
        key={textFieldPath}
        fieldPath={textFieldPath}
        optimized={optimized}
        width={13}
        onBlur={() => {
          const cleanedContent = sanitizeInput(getIn(values, textFieldPath));
          setFieldValue(textFieldPath, cleanedContent);
          setFieldTouched(textFieldPath, true);
        }}
        {...getFieldData({
          fieldPath: textFieldPath,
          fieldRepresentation: "compact",
        })}
        {...uiProps}
      />
    </GroupField>
  );
};

I18nTextInputField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  /* eslint-disable react/require-default-props */
  optimized: PropTypes.bool,
  lngFieldWidth: PropTypes.number,
  usedLanguages: PropTypes.array,
  /* eslint-enable react/require-default-props */
};
