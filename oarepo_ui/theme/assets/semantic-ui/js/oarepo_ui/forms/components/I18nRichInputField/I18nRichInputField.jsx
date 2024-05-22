import * as React from "react";
import { LanguageSelectField } from "@js/oarepo_ui";
import {
  RichInputField,
  GroupField,
  FieldLabel,
  RichEditor,
} from "react-invenio-forms";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import { useFormikContext, getIn } from "formik";
import { sanitizeInput } from "../../util";

export const I18nRichInputField = ({
  fieldPath,
  label,
  required,
  optimized,
  labelIcon,
  placeholder,
  editorConfig,
  lngFieldWidth,
  usedLanguages,
  validTags,
  ...uiProps
}) => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext();

  const fieldValue = getIn(values, `${fieldPath}.value`);

  return (
    <GroupField fieldPath={fieldPath} optimized>
      <LanguageSelectField
        fieldPath={`${fieldPath}.lang`}
        required
        width={lngFieldWidth}
        usedLanguages={usedLanguages}
      />

      <Form.Field width={13}>
        <RichInputField
          className={`${!label ? "mt-25" : ""}`}
          fieldPath={`${fieldPath}.value`}
          label={
            <FieldLabel
              htmlFor={`${fieldPath}.value`}
              icon={labelIcon}
              label={label}
            />
          }
          required={required}
          optimized={optimized}
          placeholder={placeholder}
          editor={
            <RichEditor
              value={fieldValue}
              optimized
              editorConfig={editorConfig}
              onBlur={(event, editor) => {
                const cleanedContent = sanitizeInput(
                  editor.getContent(),
                  validTags
                );
                setFieldValue(`${fieldPath}.value`, cleanedContent);
                setFieldTouched(`${fieldPath}.value`, true);
              }}
            />
          }
          {...uiProps}
        />
      </Form.Field>
    </GroupField>
  );
};

I18nRichInputField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.string,
  labelIcon: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  error: PropTypes.any,
  helpText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  disabled: PropTypes.bool,
  optimized: PropTypes.bool,
  editorConfig: PropTypes.object,
  languageOptions: PropTypes.array,
  lngFieldWidth: PropTypes.number,
  usedLanguages: PropTypes.array,
  validTags: PropTypes.array,
};

I18nRichInputField.defaultProps = {
  label: undefined,
  labelIcon: undefined,
  placeholder: undefined,
  error: undefined,
  helpText: "",
  disabled: false,
  optimized: true,
  required: false,
  editorConfig: {
    removePlugins: [
      "Image",
      "ImageCaption",
      "ImageStyle",
      "ImageToolbar",
      "ImageUpload",
      "MediaEmbed",
      "Table",
      "TableToolbar",
      "TableProperties",
      "TableCellProperties",
    ],
  },
  lngFieldWidth: 3,
};
