import * as React from "react";
import { useSanitizeInput, useFieldData } from "../../hooks";
import { LanguageSelectField } from "../LanguageSelectField";
import { TextField, GroupField } from "react-invenio-forms";
import PropTypes from "prop-types";
import { useFormikContext, getIn } from "formik";

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

  return (
    <GroupField fieldPath={fieldPath} optimized={optimized}>
      <LanguageSelectField
        fieldPath={lngFieldPath}
        width={lngFieldWidth}
        usedLanguages={usedLanguages}
        {...getFieldData({
          fieldPath: lngFieldPath,
          icon: "globe",
          fieldRepresentation: "compact",
        })}
      />
      <TextField
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
