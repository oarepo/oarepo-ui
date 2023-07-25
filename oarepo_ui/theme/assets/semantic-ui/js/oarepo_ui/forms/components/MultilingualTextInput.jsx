import React, { useEffect } from "react";
import PropTypes from "prop-types";
import {
  TextField,
  GroupField,
  ArrayField,
  FieldLabel,
  SelectField,
} from "react-invenio-forms";
import { Button, Form, Icon } from "semantic-ui-react";
import { useFormikContext, getIn } from "formik";
import _toPairs from "lodash/toPairs";
import { i18next } from "@translations/oarepo_ui/i18next";

const translateObjectToArray = (obj) => {
  return _toPairs(obj).map(([language, title]) => ({ language, name: title }));
};

export const transformArrayToObject = (arr) => {
  const result = {};

  arr.forEach((obj) => {
    const { language, name } = obj;
    result[language] = name;
  });

  return result;
};

export const MultilingualTextInput = ({
  fieldPath,
  label,
  labelIcon,
  required,
  options,
  emptyNewInput,
  newItemInitialValue,
}) => {
  const placeholderFieldPath = `_${fieldPath}`;
  const { setFieldValue, values } = useFormikContext();

  const value = getIn(values, fieldPath);
  console.log(fieldPath, label, options, emptyNewInput, newItemInitialValue, value);

  useEffect(() => {
    if (!getIn(values, placeholderFieldPath)) {
      setFieldValue(
        placeholderFieldPath,
        getIn(values, fieldPath)
          ? translateObjectToArray(getIn(values, fieldPath, ""))
          : translateObjectToArray(newItemInitialValue)
      );
      return;
    }
    setFieldValue(
      fieldPath,
      transformArrayToObject(getIn(values, placeholderFieldPath))
    );
  }, [values[placeholderFieldPath]]);

  return (
    <ArrayField
      addButtonLabel="Add another language"
      defaultNewValue={emptyNewInput}
      fieldPath={placeholderFieldPath}
      label={<FieldLabel htmlFor={fieldPath} icon="" label={label} />}
      required={required}
    >
      {({ arrayHelpers, indexPath }) => {
        const fieldPathPrefix = `_${fieldPath}.${indexPath}`;

        return (
          <GroupField optimized>
            <SelectField
              clearable
              fieldPath={`${fieldPathPrefix}.language`}
              label={i18next.t("Language")}
              optimized
              options={options.languages}
              required
              width={2}
            />

            <TextField
              fieldPath={`${fieldPathPrefix}.value`}
              label={i18next.t("Value")}
              width={9}
              required
            />

            <Form.Field>
              {indexPath > 0 && (
                <Button
                  style={{ marginTop: "1.75rem" }}
                  aria-label="remove field"
                  className="close-btn"
                  icon
                  onClick={() => arrayHelpers.remove(indexPath)}
                >
                  <Icon name="close" />
                </Button>
              )}
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
  options: PropTypes.object.isRequired,
  emptyNewInput: PropTypes.shape({
    language: PropTypes.string,
    name: PropTypes.string,
  }),
  newItemInitialValue: PropTypes.object,
};

MultilingualTextInput.defaultProps = {
  label: "Title",
  required: undefined,
  emptyNewInput: {
    language: "",
    name: "",
  },
  newItemInitialValue: { cs: "" },
};
