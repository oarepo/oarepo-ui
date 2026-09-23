import React from "react";
import PropTypes from "prop-types";
import { RemoteSelectField } from "react-invenio-forms";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  deserializeFunder,
  deserializeFunderToDropdown,
  serializeFunderFromDropdown,
} from "./util";
import { getIn, useFormikContext } from "formik";

export const FundingRemoteSelectField = ({
  fieldPath = "selectedFunding.funder",
}) => {
  const { values } = useFormikContext();
  const currentFunder = getIn(values, fieldPath);

  const serializeSuggestions = (funders) =>
    funders.map((funder) =>
      deserializeFunderToDropdown(deserializeFunder(funder)),
    );

  return (
    <RemoteSelectField
      fieldPath={fieldPath}
      suggestionAPIUrl="/api/funders"
      suggestionAPIHeaders={{
        Accept: "application/vnd.inveniordm.v1+json",
      }}
      placeholder={i18next.t("Search for a funder by name")}
      serializeSuggestions={serializeSuggestions}
      // passed through serializeSuggestions by RemoteSelectField
      initialSuggestions={currentFunder ? [currentFunder] : []}
      label={i18next.t("Funder")}
      noQueryMessage={i18next.t("Search for funder...")}
      clearable
      allowAdditions
      multiple={false}
      selectOnBlur={false}
      selectOnNavigation={false}
      required
      search={(options) => [...options]}
      value={currentFunder?.id || currentFunder?.name || ""}
      isFocused={!currentFunder}
      onValueChange={({ formikProps }, selectedFundersArray) => {
        if (!selectedFundersArray?.length) {
          formikProps.form.setFieldValue(fieldPath, undefined);
          return;
        }
        // on addition, the new funder is appended to the previous selection
        formikProps.form.setFieldValue(
          fieldPath,
          serializeFunderFromDropdown(selectedFundersArray.at(-1)),
        );
      }}
    />
  );
};

FundingRemoteSelectField.propTypes = {
  // eslint-disable-next-line react/require-default-props
  fieldPath: PropTypes.string,
};
