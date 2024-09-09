import React from "react";
import { RichEditor } from "react-invenio-forms";
import { useFormikContext, getIn } from "formik";
import { useSanitizeInput } from "@js/oarepo_ui";
import PropTypes from "prop-types";

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
        toolbar:
          "blocks | bold italic | bullist numlist | outdent indent | undo redo",
        block_formats: "Paragraph=p; Header 1=h1; Header 2=h2; Header 3=h3",
        ...editorConfig,
      }}
    />
  );
};

OarepoRichEditor.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  editorConfig: PropTypes.object,
};
