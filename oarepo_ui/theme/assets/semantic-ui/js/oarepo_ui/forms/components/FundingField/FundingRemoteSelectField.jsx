import React from "react";
import { RemoteSelectField } from "react-invenio-forms";
import { i18next } from "@translations/oarepo_ui/i18next";
import { deserializeFunder } from "./util";
import { getIn, useFormikContext } from "formik";

export const FundingRemoteSelectField = () => {
  function deserializeFunderToDropdown(funderItem) {
    const funderName = funderItem?.name;
    const funderPID = funderItem?.id;
    const funderCountry = funderItem?.country_name ?? funderItem?.country;

    if (!funderName && !funderPID) {
      return {};
    }

    return {
      text: [funderName, funderCountry, funderPID]
        .filter((val) => val)
        .join(", "),
      value: funderItem.id,
      key: funderItem.id,
      ...(funderName && { name: funderName }),
    };
  }

  function serializeFunderFromDropdown(funderDropObject) {
    return {
      id: funderDropObject.key,
      ...(funderDropObject.name && { name: funderDropObject.name }),
    };
  }
  const { values } = useFormikContext();
  const selectedFunding = getIn(values, "selectedFunding.funder.id", "");
  return (
    <RemoteSelectField
      fieldPath="selectedFunding.funder.id"
      suggestionAPIUrl="/api/funders"
      suggestionAPIHeaders={{
        Accept: "application/vnd.inveniordm.v1+json",
      }}
      placeholder={i18next.t("Search for a funder by name")}
      serializeSuggestions={(funders) => {
        return funders.map((funder) =>
          deserializeFunderToDropdown(deserializeFunder(funder))
        );
      }}
      searchInput={{
        autoFocus: !!selectedFunding,
      }}
      label={i18next.t("Funder")}
      noQueryMessage={i18next.t("Search for funder...")}
      clearable
      allowAdditions={false}
      multiple={false}
      selectOnBlur={false}
      selectOnNavigation={false}
      required
      search={(options) => options}
      isFocused
      onValueChange={({ formikProps }, selectedFundersArray) => {
        if (selectedFundersArray.length === 1) {
          const selectedFunder = selectedFundersArray[0];
          if (selectedFunder) {
            const deserializedFunder =
              serializeFunderFromDropdown(selectedFunder);
            formikProps.form.setFieldValue(
              "selectedFunding.funder",
              deserializedFunder
            );
          }
        }
      }}
    />
  );
};
