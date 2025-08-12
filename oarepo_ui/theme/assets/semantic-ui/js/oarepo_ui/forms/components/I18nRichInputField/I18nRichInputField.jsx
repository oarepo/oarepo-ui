import * as React from "react";
import { LanguageSelectField, useFieldData, OarepoRichEditor } from "@js/oarepo_ui";
import { RichInputField, GroupField } from "react-invenio-forms";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";

export const I18nRichInputField = ({
  fieldPath,
  optimized = true,
  editorConfig = {},
  lngFieldWidth = 3,
  usedLanguages = [],
  ...uiProps
}) => {
  const lngFieldPath = `${fieldPath}.lang`;
  const textFieldPath = `${fieldPath}.value`;
  const { getFieldData } = useFieldData();

  return (
    <GroupField fieldPath={fieldPath} optimized={optimized}>
      <LanguageSelectField
        fieldPath={lngFieldPath}
        width={lngFieldWidth}
        usedLanguages={usedLanguages}
        {...getFieldData({
          fieldPath: lngFieldPath,
          icon: "globe",
          fieldRepresentation: "compact",
        })}
      />

      <Form.Field width={13}>
        <RichInputField
          fieldPath={textFieldPath}
          optimized={optimized}
          editor={<OarepoRichEditor fieldPath={textFieldPath} />}
          {...uiProps}
          {...getFieldData({
            fieldPath: textFieldPath,
            fieldRepresentation: "compact",
          })}
        />
      </Form.Field>
    </GroupField>
  );
};

I18nRichInputField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  // eslint-disable-next-line react/require-default-props
  optimized: PropTypes.bool,
  // eslint-disable-next-line react/require-default-props
  editorConfig: PropTypes.object,
  // eslint-disable-next-line react/require-default-props
  lngFieldWidth: PropTypes.number,
  // eslint-disable-next-line react/require-default-props
  usedLanguages: PropTypes.array,
};
