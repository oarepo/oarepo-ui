import * as React from "react";
import { useFieldData } from "../../hooks";
import { OarepoRichEditor } from "./OarepoRichEditor";
import { RichInputField, GroupField } from "react-invenio-forms";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import { RemoteLanguageSelectField } from "../LanguageSelectField";

export const I18nRichInputField = ({
  fieldPath,
  optimized = true,
  editorConfig = {},
  lngFieldWidth = 3,
  usedLanguages = [],
  ...uiProps
}) => {
  const lngFieldPath = `${fieldPath}.lang`;
  const textFieldPath = `${fieldPath}.value`;
  const { getFieldData } = useFieldData();

  return (
    <GroupField fieldPath={fieldPath} optimized={optimized}>
      <RemoteLanguageSelectField
        fieldPath={lngFieldPath}
        lngFieldWidth={lngFieldWidth}
        usedLanguages={usedLanguages}
      />

      <Form.Field width={13}>
        <RichInputField
          fieldPath={textFieldPath}
          optimized={optimized}
          editor={<OarepoRichEditor fieldPath={textFieldPath} />}
          {...uiProps}
          {...getFieldData({
            fieldPath: textFieldPath,
            fieldRepresentation: "compact",
          })}
        />
      </Form.Field>
    </GroupField>
  );
};

I18nRichInputField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  /* eslint-disable react/require-default-props */
  optimized: PropTypes.bool,
  editorConfig: PropTypes.object,
  lngFieldWidth: PropTypes.number,
  usedLanguages: PropTypes.array,
  /* eslint-enable react/require-default-props */
};
