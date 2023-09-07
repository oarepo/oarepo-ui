import React from "react";
import PropTypes from "prop-types";
import { GroupField, ArrayField, FieldLabel } from "react-invenio-forms";
import { Button, Icon, Form } from "semantic-ui-react";
import {
  I18nTextInputField,
  I18nRichInputField,
  useVocabularyOptions,
  eliminateUsedLanguages,
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
  ...uiProps
}) => {
  const { options: allLanguages } = useVocabularyOptions("languages");

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
        const availableLanguages = eliminateUsedLanguages(
          indexPath,
          allLanguages,
          array
        );
        return (
          <GroupField>
            <Form.Field width={16}>
              {rich ? (
                <I18nRichInputField
                  key={availableLanguages.length}
                  fieldPath={fieldPathPrefix}
                  label={textFieldLabel}
                  labelIcon={textFieldIcon}
                  editorConfig={editorConfig}
                  optimized
                  required={required}
                  languageOptions={availableLanguages}
                  {...uiProps}
                />
              ) : (
                <I18nTextInputField
                  key={availableLanguages.length}
                  fieldPath={fieldPathPrefix}
                  label={textFieldLabel}
                  labelIcon={textFieldIcon}
                  required={required}
                  languageOptions={availableLanguages}
                  {...uiProps}
                />
              )}
            </Form.Field>
            <Form.Field style={{ marginTop: "1.75rem" }}>
              <Button
                aria-label={i18next.t("Remove field")}
                className="close-btn"
                icon
                onClick={() => arrayHelpers.remove(indexPath)}
              >
                <Icon name="close" />
              </Button>
            </Form.Field>
          </GroupField>
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
