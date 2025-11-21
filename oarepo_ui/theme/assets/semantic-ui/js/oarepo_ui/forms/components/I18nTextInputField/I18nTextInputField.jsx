import * as React from "react";
import { GroupField } from "react-invenio-forms";
import PropTypes from "prop-types";
import { RemoteLanguageSelectField } from "../LanguageSelectField";
import { TextField } from "../TextField";

export const I18nTextInputField = ({
  fieldPath,
  optimized = true,
  lngFieldWidth = 3,
  usedLanguages = [],
  ...uiProps
}) => {
  const lngFieldPath = `${fieldPath}.lang`;
  const textFieldPath = `${fieldPath}.value`;

  return (
    <GroupField fieldPath={fieldPath} optimized={optimized}>
      <RemoteLanguageSelectField
        fieldPath={lngFieldPath}
        lngFieldWidth={lngFieldWidth}
        usedLanguages={usedLanguages}
      />
      <TextField
        fieldPath={textFieldPath}
        optimized={optimized}
        width={13}
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
