import React from "react";
import { useFormikContext, getIn } from "formik";
import { useFieldData } from "../../hooks";
import { LanguagesField } from "@js/invenio_rdm_records";
import { serializer } from "./util";
import PropTypes from "prop-types";

export const RemoteLanguageSelectField = ({
  fieldPath,
  lngFieldWidth,
  usedLanguages = [],
  ...uiProps
}) => {
  const { values } = useFormikContext();
  const { getFieldData } = useFieldData();

  return (
    <LanguagesField
      serializeSuggestions={serializer}
      initialOptions={
        getIn(values, fieldPath) ? [getIn(values, fieldPath)] : []
      }
      {...getFieldData({
        fieldPath: fieldPath,
        icon: "globe",
        fieldRepresentation: "compact",
      })}
      fieldPath={fieldPath}
      multiple={false}
      labelIcon={null}
      clearable
      selectOnBlur={false}
      width={lngFieldWidth}
      search={(options) =>
        options.filter(
          (o) =>
            !usedLanguages.includes(o.value) ||
            o.value === getIn(values, fieldPath)
        )
      }
      {...uiProps}
    />
  );
};

RemoteLanguageSelectField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  /* eslint-disable react/require-default-props */
  lngFieldWidth: PropTypes.number,
  usedLanguages: PropTypes.array,
  /* eslint-enable react/require-default-props */
};
