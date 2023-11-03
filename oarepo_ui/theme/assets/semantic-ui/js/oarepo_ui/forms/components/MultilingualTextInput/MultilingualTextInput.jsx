import React from "react";
import PropTypes from "prop-types";
import { ArrayField, FieldLabel } from "react-invenio-forms";
import { Form } from "semantic-ui-react";
import {
  I18nTextInputField,
  I18nRichInputField,
  ArrayFieldItem,
} from "@js/oarepo_ui";
import { i18next } from "@translations/oarepo_ui/i18next";

export const MultilingualTextInput = ({
  fieldPath,
  label,
  labelIcon,
  required,
  emptyNewInput,
  rich,
  editorConfig,
  textFieldLabel,
  textFieldIcon,
  helpText,
  addButtonLabel,
  lngFieldWidth,
  ...uiProps
}) => {
  return (
    <ArrayField
      addButtonLabel={addButtonLabel}
      defaultNewValue={emptyNewInput}
      fieldPath={fieldPath}
      label={
        <FieldLabel htmlFor={fieldPath} icon={labelIcon ?? ""} label={label} />
      }
      helpText={helpText}
    >
      {({ indexPath, array, arrayHelpers }) => {
        const fieldPathPrefix = `${fieldPath}.${indexPath}`;

        return (
          <ArrayFieldItem
            indexPath={indexPath}
            array={array}
            arrayHelpers={arrayHelpers}
          >
            <Form.Field width={16}>
              {rich ? (
                <I18nRichInputField
                  fieldPath={fieldPathPrefix}
                  label={textFieldLabel}
                  labelIcon={textFieldIcon}
                  editorConfig={editorConfig}
                  optimized
                  required={required}
                  usedLanguages={array.map((v) => v.lang)}
                  lngFieldWidth={lngFieldWidth}
                  {...uiProps}
                />
              ) : (
                <I18nTextInputField
                  fieldPath={fieldPathPrefix}
                  label={textFieldLabel}
                  labelIcon={textFieldIcon}
                  required={required}
                  usedLanguages={array.map((v) => v.lang)}
                  lngFieldWidth={lngFieldWidth}
                  {...uiProps}
                />
              )}
            </Form.Field>
          </ArrayFieldItem>
        );
      }}
    </ArrayField>
  );
};

MultilingualTextInput.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.string,
  labelIcon: PropTypes.string,
  required: PropTypes.bool,
  hasRichInput: PropTypes.bool,
  editorConfig: PropTypes.object,
  textFieldLabel: PropTypes.string,
  textFieldIcon: PropTypes.string,
  helpText: PropTypes.string,
  addButtonLabel: PropTypes.string,
  lngFieldWidth: PropTypes.number,
  rich: PropTypes.bool,
};

MultilingualTextInput.defaultProps = {
  emptyNewInput: {
    lang: "",
    value: "",
  },
  rich: false,
  label: undefined,
  addButtonLabel: i18next.t("Add another language"),
};
