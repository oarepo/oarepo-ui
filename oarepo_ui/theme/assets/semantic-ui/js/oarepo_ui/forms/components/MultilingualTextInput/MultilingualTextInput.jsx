import React from "react";
import PropTypes from "prop-types";
import {
  TextField,
  GroupField,
  ArrayField,
  FieldLabel,
  SelectField,
  RichInputField,
} from "react-invenio-forms";
import { Button, Form, Icon, Popup } from "semantic-ui-react";
import { useFormConfig } from "@js/oarepo_ui";
import { i18next } from "@translations/oarepo_ui/i18next";

// could be hoisted to oarepo ui utils?

const eliminateUsedLanguages = (excludeIndex, languageOptions, fieldArray) => {
  const currentlySelectedLanguage = fieldArray[excludeIndex].lang;
  const excludedLanguages = fieldArray.filter(
    (item) => item.lang !== currentlySelectedLanguage && item.lang
  );
  const remainingLanguages = languageOptions.filter(
    (option) =>
      !excludedLanguages.map((item) => item.lang).includes(option.value)
  );
  return remainingLanguages;
};

// slight issue is that invenio's ArrayField, adds a negative key to each object when you add an item
// we could sanitize this before posting?
const PopupComponent = ({ content, trigger }) => (
  <Popup
    basic
    inverted
    position="bottom center"
    content={content}
    trigger={trigger}
  />
);
export const MultilingualTextInput = ({
  fieldPath,
  label,
  labelIcon,
  required,
  emptyNewInput,
  hasRichInput,
  editorConfig,
  textFieldLabel,
  richFieldLabel,
  helpText,
}) => {
  const {
    formConfig: {
      vocabularies: { languages },
    },
  } = useFormConfig();

  return (
    <ArrayField
      addButtonLabel="Add another language"
      defaultNewValue={emptyNewInput}
      fieldPath={fieldPath}
      label={
        <FieldLabel htmlFor={fieldPath} icon={labelIcon ?? ""} label={label} />
      }
      required={required}
      helpText={helpText}
    >
      {({ indexPath, array, arrayHelpers }) => {
        const fieldPathPrefix = `${fieldPath}.${indexPath}`;

        const availableOptions = eliminateUsedLanguages(
          indexPath,
          languages,
          array
        );

        return (
          <GroupField optimized>
            <Form.Field width={3}>
              <SelectField
                // necessary because otherwise other inputs are not rerendered and keep the previous state i.e. I could potentially choose two same languages in some scenarios
                key={availableOptions}
                clearable
                fieldPath={`${fieldPathPrefix}.lang`}
                label="Language"
                optimized
                options={availableOptions}
                required={required}
                selectOnBlur={false}
              />
              {hasRichInput && (
                <PopupComponent
                  content={i18next.t("Remove description")}
                  trigger={
                    <Button
                      aria-label="remove field"
                      className="rel-mt-1"
                      icon
                      onClick={() => arrayHelpers.remove(indexPath)}
                      fluid
                    >
                      <Icon name="close" />
                    </Button>
                  }
                />
              )}
            </Form.Field>

            {hasRichInput ? (
              <Form.Field width={13}>
                <RichInputField
                  fieldPath={`${fieldPathPrefix}.value`}
                  label={richFieldLabel}
                  editorConfig={editorConfig}
                  optimized
                  required={required}
                />
              </Form.Field>
            ) : (
              <TextField
                fieldPath={`${fieldPathPrefix}.value`}
                label={textFieldLabel}
                required={required}
                width={13}
                icon={
                  <PopupComponent
                    content={i18next.t("Remove field")}
                    trigger={
                      <Button
                        className="rel-ml-1"
                        onClick={() => arrayHelpers.remove(indexPath)}
                      >
                        <Icon fitted name="close" />
                      </Button>
                    }
                  />
                }
              />
            )}
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
  richFieldLabel: PropTypes.string,
  helpText: PropTypes.string,
};

MultilingualTextInput.defaultProps = {
  label: "Title",
  emptyNewInput: {
    lang: "",
    value: "",
  },
  newItemInitialValue: [{ language: "cs", value: "" }],
  hasRichInput: false,
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
  textFieldLabel: i18next.t("Name"),
  richFieldLabel: i18next.t("Description"),
};
