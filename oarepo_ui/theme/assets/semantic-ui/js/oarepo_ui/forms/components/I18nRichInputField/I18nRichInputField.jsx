import * as React from "react";
import {
  LanguageSelectField,
  useFieldData,
  OarepoRichEditor,
} from "@js/oarepo_ui";
import { RichInputField, GroupField } from "react-invenio-forms";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";

export const I18nRichInputField = ({
  fieldPath,
  optimized,
  editorConfig,
  lngFieldWidth,
  usedLanguages,
  ...uiProps
}) => {
  const lngFieldPath = `${fieldPath}.lang`;
  const textFieldPath = `${fieldPath}.value`;
  const { getFieldData } = useFieldData();

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
  optimized: PropTypes.bool,
  editorConfig: PropTypes.object,
  lngFieldWidth: PropTypes.number,
  usedLanguages: PropTypes.array,
};

I18nRichInputField.defaultProps = {
  optimized: true,
  lngFieldWidth: 3,
};
