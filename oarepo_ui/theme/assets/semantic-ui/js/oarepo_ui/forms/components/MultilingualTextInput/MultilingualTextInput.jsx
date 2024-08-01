import React from "react";
import PropTypes from "prop-types";
import { ArrayField } from "react-invenio-forms";
import { Form } from "semantic-ui-react";
import {
  I18nTextInputField,
  I18nRichInputField,
  ArrayFieldItem,
  useDefaultLocale,
  useFormFieldValue,
  useShowEmptyValue,
  useFieldData,
} from "@js/oarepo_ui";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useFormikContext, getIn } from "formik";

export const MultilingualTextInput = ({
  fieldPath,
  labelIcon,
  defaultNewValue,
  rich,
  editorConfig,
  addButtonLabel,
  lngFieldWidth,
  showEmptyValue,
  prefillLanguageWithDefaultLocale,
  removeButtonLabelClassName,
  displayFirstInputRemoveButton,
  ...uiProps
}) => {
  const { defaultLocale } = useDefaultLocale();
  const { getFieldData } = useFieldData();

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
      addButtonClassName="array-field-add-button"
      {...getFieldData({ fieldPath, icon: labelIcon })}
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
                  editorConfig={editorConfig}
                  optimized
                  usedLanguages={usedLanguages}
                  lngFieldWidth={lngFieldWidth}
                  {...uiProps}
                />
              ) : (
                <I18nTextInputField
                  fieldPath={fieldPathPrefix}
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
  labelIcon: PropTypes.string,
  rich: PropTypes.bool,
  editorConfig: PropTypes.object,
  addButtonLabel: PropTypes.string,
  lngFieldWidth: PropTypes.number,
  defaultNewValue: PropTypes.object,
  showEmptyValue: PropTypes.bool,
  prefillLanguageWithDefaultLocale: PropTypes.bool,
  removeButtonLabelClassName: PropTypes.string,
  displayFirstInputRemoveButton: PropTypes.bool,
};

MultilingualTextInput.defaultProps = {
  defaultNewValue: {
    lang: "",
    value: "",
  },
  rich: false,
  addButtonLabel: i18next.t("Add another language"),
  showEmptyValue: false,
  prefillLanguageWithDefaultLocale: false,
  displayFirstInputRemoveButton: true,
};
