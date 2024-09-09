import * as React from "react";
import {
  LanguageSelectField,
  useSanitizeInput,
  useFieldData,
  OarepoRichEditor,
} from "@js/oarepo_ui";
import { RichInputField, GroupField } from "react-invenio-forms";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import { useFormikContext, getIn } from "formik";

export const I18nRichInputField = ({
  fieldPath,
  optimized,
  editorConfig,
  lngFieldWidth,
  usedLanguages,
  ...uiProps
}) => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext();
  const { sanitizeInput } = useSanitizeInput();
  const lngFieldPath = `${fieldPath}.lang`;
  const textFieldPath = `${fieldPath}.value`;
  const fieldValue = getIn(values, textFieldPath);
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
          editorConfig={editorConfig}
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
