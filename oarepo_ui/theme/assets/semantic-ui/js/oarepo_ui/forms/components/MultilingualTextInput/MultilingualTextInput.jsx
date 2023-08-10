import React, { useEffect, useMemo } from "react";
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
import { useFormikContext, getIn } from "formik";
import _toPairs from "lodash/toPairs";
import { useFormConfig, array2object, object2array } from "@js/oarepo_ui";
import { i18next } from "@translations/oarepo_ui/i18next";

const eliminateUsedLanguages = (excludeIndex, languageOptions, fieldArray) => {
  const currentlySelectedLanguage = fieldArray[excludeIndex].language;
  const excludedLanguages = fieldArray.filter(
    (item) => item.language !== currentlySelectedLanguage && item.language
  );
  const remainingLanguages = languageOptions.filter(
    (option) =>
      !excludedLanguages.map((item) => item.language).includes(option.value)
  );
  return remainingLanguages;
};

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
  newItemInitialValue,
  hasRichInput,
  editorConfig,
  textFieldLabel,
  richFieldLabel,
}) => {
  const {
    formConfig: {
      vocabularies: { languages },
    },
  } = useFormConfig();

  // to have only property with _ for internal multilignaul field i.e. if used inside another component in previous implementation, it would start to set the main object property instead of the internal _ representation
  const placeholderFieldPath = useMemo(() => {
    return fieldPath
      .split(".")
      .map((part, index, array) =>
        index === array.length - 1 ? `_${part}` : part
      )
      .join(".");
  }, [fieldPath]);
  const { setFieldValue, values } = useFormikContext();
  useEffect(() => {
    if (!getIn(values, placeholderFieldPath)) {
      setFieldValue(
        placeholderFieldPath,
        getIn(values, fieldPath)
          ? object2array(getIn(values, fieldPath, ""), "language", "name")
          : object2array(newItemInitialValue, "language", "name")
      );
      return;
    }
    setFieldValue(
      fieldPath,
      array2object(getIn(values, placeholderFieldPath), "language", "name")
    );
  }, [values[placeholderFieldPath]]);

  return (
    <ArrayField
      addButtonLabel="Add another language"
      defaultNewValue={emptyNewInput}
      fieldPath={placeholderFieldPath}
      label={
        <FieldLabel htmlFor={fieldPath} icon={labelIcon ?? ""} label={label} />
      }
      required={required}
    >
      {({ indexPath, array, arrayHelpers }) => {
        const fieldPathPrefix = `${placeholderFieldPath}.${indexPath}`;

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
                fieldPath={`${fieldPathPrefix}.language`}
                label="Language"
                optimized
                options={availableOptions}
                required={required}
                selectOnBlur={false}
              />
              {indexPath > 0 && hasRichInput && (
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
                  fieldPath={`${fieldPathPrefix}.name`}
                  label={richFieldLabel}
                  editorConfig={editorConfig}
                  optimized
                  required={required}
                />
              </Form.Field>
            ) : (
              <TextField
                fieldPath={`${fieldPathPrefix}.name`}
                label={textFieldLabel}
                required={required}
                width={13}
                icon={
                  indexPath > 0 ? (
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
                  ) : null
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
  newItemInitialValue: PropTypes.object,
  hasRichInput: PropTypes.bool,
  editorConfig: PropTypes.object,
  textFieldLabel: PropTypes.string,
  richFieldLabel: PropTypes.string,
};

MultilingualTextInput.defaultProps = {
  label: "Title",
  required: undefined,
  emptyNewInput: {
    language: "",
    name: "",
  },
  newItemInitialValue: { cs: "" },
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
