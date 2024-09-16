import React from "react";
import { RichEditor } from "react-invenio-forms";
import { useFormikContext, getIn } from "formik";
import { useSanitizeInput } from "@js/oarepo_ui";
import PropTypes from "prop-types";

export const toolBar =
  "blocks | bold italic | bullist numlist | outdent indent | undo redo";

export const OarepoRichEditor = ({ fieldPath, editorConfig }) => {
  const { sanitizeInput, validEditorTags } = useSanitizeInput();

  const { values, setFieldValue, setFieldTouched } = useFormikContext();
  const fieldValue = getIn(values, fieldPath, "");
  return (
    <RichEditor
      initialValue={fieldValue}
      inputValue={() => fieldValue}
      optimized
      onBlur={(event, editor) => {
        const cleanedContent = sanitizeInput(editor.getContent());
        setFieldValue(fieldPath, cleanedContent);
        setFieldTouched(fieldPath, true);
      }}
      editorConfig={{
        valid_elements: validEditorTags,
        toolbar: toolBar,
        ...editorConfig,
      }}
    />
  );
};

OarepoRichEditor.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  editorConfig: PropTypes.object,
};
