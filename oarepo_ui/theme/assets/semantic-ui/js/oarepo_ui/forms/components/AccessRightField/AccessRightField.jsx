import React from "react";
import { Field } from "formik";
import { AccessRightFieldCmp } from "@js/invenio_rdm_records/src/deposit/fields/AccessField/AccessRightField";
import PropTypes from "prop-types";
import { useFormConfig } from "@js/oarepo_ui";
import { I18nextProvider } from "react-i18next";
import { i18next } from "@translations/invenio_rdm_records/i18next";

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
  const { allowed_communities: allowedCommunities } = useFormConfig();

  return (
    <I18nextProvider i18n={i18next}>
      <Field name={fieldPath}>
        {(formik) => {
          const mainCommunity =
            community ||
            allowedCommunities.find(
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
    </I18nextProvider>
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
