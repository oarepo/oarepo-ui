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
  useShowEmptyValue,
} from "@js/oarepo_ui";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useFormikContext, getIn } from "formik";

export const MultilingualTextInput = ({
  fieldPath,
  label,
  labelIcon,
  required,
  defaultNewValue,
  rich,
  editorConfig,
  textFieldLabel,
  textFieldIcon,
  helpText,
  addButtonLabel,
  lngFieldWidth,
  showEmptyValue,
  prefillLanguageWithDefaultLocale,
  useModelData,
  removeButtonLabelClassName,
  displayFirstInputRemoveButton,
  ...uiProps
}) => {
  const { defaultLocale } = useDefaultLocale();

  const { values } = useFormikContext();
  const { usedSubValues, defaultNewValue: getNewValue } = useFormFieldValue({
    defaultValue: defaultLocale,
    fieldPath,
    subValuesPath: "lang",
  });
  const value = getIn(values, fieldPath);
  const usedLanguages = usedSubValues(value);

  useShowEmptyValue(fieldPath, defaultNewValue, showEmptyValue);
  return (
    <ArrayField
      addButtonLabel={addButtonLabel}
      defaultNewValue={
        prefillLanguageWithDefaultLocale
          ? getNewValue(defaultNewValue, usedLanguages)
          : defaultNewValue
      }
      fieldPath={fieldPath}
      label={
        <FieldLabel htmlFor={fieldPath} icon={labelIcon ?? ""} label={label} />
      }
      helpText={helpText}
      addButtonClassName="array-field-add-button"
    >
      {({ indexPath, arrayHelpers }) => {
        const fieldPathPrefix = `${fieldPath}.${indexPath}`;

        return (
          <ArrayFieldItem
            indexPath={indexPath}
            arrayHelpers={arrayHelpers}
            removeButtonLabelClassName={removeButtonLabelClassName}
            displayFirstInputRemoveButton={displayFirstInputRemoveButton}
            fieldPathPrefix={fieldPathPrefix}
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
                  useModelData={useModelData}
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
                  useModelData={useModelData}
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
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
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
  defaultNewValue: PropTypes.object,
  showEmptyValue: PropTypes.bool,
  prefillLanguageWithDefaultLocale: PropTypes.bool,
  // whether or not the nested components shall call to get input information from the model
  useModelData: PropTypes.bool,
  removeButtonLabelClassName: PropTypes.string,
  displayFirstInputRemoveButton: PropTypes.bool,
};

MultilingualTextInput.defaultProps = {
  defaultNewValue: {
    lang: "",
    value: "",
  },
  rich: false,
  label: undefined,
  addButtonLabel: i18next.t("Add another language"),
  showEmptyValue: false,
  prefillLanguageWithDefaultLocale: false,
  useModelData: true,
  displayFirstInputRemoveButton: true,
};
