import React, { useEffect, useRef } from "react";
import { Field, useFormikContext } from "formik";
import { AccessRightFieldCmp } from "@js/invenio_rdm_records/src/deposit/fields/AccessField/AccessRightField";
import PropTypes from "prop-types";
import { useFormConfig } from "@js/oarepo_ui";

export const AccessRightField = ({
  fieldPath,
  label,
  labelIcon,
  showMetadataAccess,
  community,
  record,
  recordRestrictionGracePeriod,
  allowRecordRestriction,
}) => {
  const { values } = useFormikContext();
  const {
    formConfig: { allowed_communities },
  } = useFormConfig();

  const mounted = useRef(false);
  // when you enable embargo to scroll the embargo related inputs into view
  useEffect(() => {
    // don't scroll it into view on mount if the input exists
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const embargoReasonInput = document.getElementById("access.embargo.reason");
    if (embargoReasonInput) {
      const rect = embargoReasonInput.getBoundingClientRect();
      window.scrollTo(0, document.body.scrollHeight - rect.y);
    }
  }, [values?.access?.embargo?.active]);
  return (
    <Field name={fieldPath}>
      {(formik) => {
        const mainCommunity =
          community ||
          allowed_communities.find(
            (c) => c.id === record?.parent?.communities?.default
          );
        return (
          <AccessRightFieldCmp
            formik={formik}
            fieldPath={fieldPath}
            label={label}
            labelIcon={labelIcon}
            showMetadataAccess={showMetadataAccess}
            community={mainCommunity}
            record={record}
            recordRestrictionGracePeriod={recordRestrictionGracePeriod}
            allowRecordRestriction={allowRecordRestriction}
          />
        );
      }}
    </Field>
  );
};

AccessRightField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  labelIcon: PropTypes.string.isRequired,
  showMetadataAccess: PropTypes.bool,
  community: PropTypes.object,
  record: PropTypes.object.isRequired,
  recordRestrictionGracePeriod: PropTypes.number.isRequired,
  allowRecordRestriction: PropTypes.bool.isRequired,
};

AccessRightField.defaultProps = {
  showMetadataAccess: true,
  community: undefined,
};
