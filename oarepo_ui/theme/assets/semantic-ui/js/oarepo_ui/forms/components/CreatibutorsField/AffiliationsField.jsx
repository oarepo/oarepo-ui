import PropTypes from "prop-types";
import React from "react";
import { FieldLabel, RemoteSelectField } from "react-invenio-forms";
import { Field, getIn } from "formik";
import { i18next } from "@translations/oarepo_ui/i18next";
import { serializeAffiliations } from "./util";

export const AffiliationsField = ({ fieldPath, selectRef }) => {
  return (
    <Field name={fieldPath}>
      {({ form: { values } }) => {
        return (
          <RemoteSelectField
            fieldPath={fieldPath}
            suggestionAPIUrl="/api/affiliations"
            suggestionAPIHeaders={{
              Accept: "application/json",
            }}
            initialSuggestions={getIn(values, fieldPath, [])}
            serializeSuggestions={serializeAffiliations}
            placeholder={i18next.t("Search or create affiliation")}
            label={
              <FieldLabel
                htmlFor={`${fieldPath}.name`}
                label={i18next.t("Affiliations")}
              />
            }
            noQueryMessage={i18next.t("Search for affiliations..")}
            allowAdditions
            clearable
            multiple
            onValueChange={({ formikProps }, selectedSuggestions) => {
              formikProps.form.setFieldValue(fieldPath, selectedSuggestions);
            }}
            value={getIn(values, fieldPath, []).map(
              (val) => val.name || val.id || val.text
            )}
            ref={selectRef}
            search={(options) => options}
          />
        );
      }}
    </Field>
  );
};

AffiliationsField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  selectRef: PropTypes.object.isRequired,
};
