import React from "react";
import PropTypes from "prop-types";
import { ArrayField, FieldLabel } from "react-invenio-forms";
import { Form } from "semantic-ui-react";
import {
  I18nTextInputField,
  I18nRichInputField,
  ArrayFieldItem,
  useDefaultLocale,
  useFormFieldValue,
} from "@js/oarepo_ui";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useFormikContext, getIn } from "formik";

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
  const { defaultLocale } = useDefaultLocale();
  const { values } = useFormikContext();
  const { usedSubValues, defaultNewValue } = useFormFieldValue({
    defaultValue: defaultLocale,
    fieldPath,
    subValuesPath: "lang",
  });
  const value = getIn(values, fieldPath);
  const usedLanguages = usedSubValues(value);
  const newValue = defaultNewValue(emptyNewInput, usedLanguages);

  return (
    <ArrayField
      addButtonLabel={addButtonLabel}
      defaultNewValue={newValue}
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
                  usedLanguages={usedLanguages}
                  lngFieldWidth={lngFieldWidth}
                  {...uiProps}
                />
              ) : (
                <I18nTextInputField
                  fieldPath={fieldPathPrefix}
                  label={textFieldLabel}
                  labelIcon={textFieldIcon}
                  required={required}
                  usedLanguages={usedLanguages}
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
