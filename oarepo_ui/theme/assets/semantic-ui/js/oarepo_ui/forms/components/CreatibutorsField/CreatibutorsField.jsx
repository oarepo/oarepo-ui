import React, { useMemo } from "react";
import { CreatibutorsField as InvenioCreatibutorsField } from "@js/invenio_rdm_records";
import { overrideStore, OverridableContext } from "react-overridable";
import PropTypes from "prop-types";
import { useFieldData } from "../../hooks";
import { Form } from "semantic-ui-react";

const storeComponents = overrideStore.getAll();

export const CreatibutorsField = ({
  overrides,
  label,
  icon = "user",
  fieldPath,
  ...props
}) => {
  const mergedOverrides = useMemo(() => {
    return { ...overrides, ...storeComponents };
  }, [overrides]);
  const { getFieldData } = useFieldData();
  const fieldData = {
    ...getFieldData({ fieldPath, icon, fieldRepresentation: "text" }),
  };

  return (
    <OverridableContext.Provider value={mergedOverrides}>
      <Form.Field className="oarepo-creatibutors-field-container">
        <InvenioCreatibutorsField
          fieldPath={fieldPath}
          labelIcon={null}
          {...fieldData}
          {...props}
        />
      </Form.Field>
    </OverridableContext.Provider>
  );
};

CreatibutorsField.propTypes = {
  overrides: PropTypes.object,
  label: PropTypes.string,
  icon: PropTypes.string,
  fieldPath: PropTypes.string.isRequired,
};
