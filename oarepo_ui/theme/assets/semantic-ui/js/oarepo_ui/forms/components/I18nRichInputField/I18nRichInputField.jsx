import * as React from "react";
import { LanguageSelectField } from "@js/oarepo_ui";
import { RichInputField, GroupField, FieldLabel } from "react-invenio-forms";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";

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
  ...uiProps
}) => {
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
          editorConfig={editorConfig}
          // TODO: hacky fix for SUI alignment bug for case with
          // field groups with empty field label on one of inputs
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
