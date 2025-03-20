import React from "react";
import { Field } from "formik";
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
  const {
    formConfig: { allowed_communities },
  } = useFormConfig();

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
