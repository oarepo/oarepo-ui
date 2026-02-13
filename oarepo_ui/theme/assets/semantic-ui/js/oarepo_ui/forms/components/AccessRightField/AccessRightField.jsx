import React from "react";
import { Field } from "formik";
import { AccessRightFieldCmp } from "@js/invenio_rdm_records/src/deposit/fields/AccessField/AccessRightField";
import PropTypes from "prop-types";
import { I18nextProvider } from "react-i18next";
import { i18next } from "@translations/invenio_rdm_records/i18next";

// TODO: when community selection starts working in UI, only then we can properly test this component. It could
// happen that we can just do import from invenio now that we have redux as well.
export const AccessRightField = ({
  fieldPath,
  label,
  labelIcon,
  showMetadataAccess = true,
  community,
  record,
  recordRestrictionGracePeriod,
  allowRecordRestriction,
}) => {
  return (
    <I18nextProvider i18n={i18next}>
      <Field name={fieldPath}>
        {(formik) => {
          return (
            <AccessRightFieldCmp
              formik={formik}
              fieldPath={fieldPath}
              label={label}
              labelIcon={labelIcon}
              showMetadataAccess={showMetadataAccess}
              community={community}
              record={record}
              recordRestrictionGracePeriod={recordRestrictionGracePeriod}
              allowRecordRestriction={allowRecordRestriction}
            />
          );
        }}
      </Field>
    </I18nextProvider>
  );
};

AccessRightField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  labelIcon: PropTypes.string.isRequired,
  // eslint-disable-next-line react/require-default-props
  showMetadataAccess: PropTypes.bool,
  // eslint-disable-next-line react/require-default-props
  community: PropTypes.object,
  record: PropTypes.object.isRequired,
  recordRestrictionGracePeriod: PropTypes.number.isRequired,
  allowRecordRestriction: PropTypes.bool.isRequired,
};
