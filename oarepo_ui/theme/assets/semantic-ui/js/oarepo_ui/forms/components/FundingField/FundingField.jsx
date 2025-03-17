import React, { useMemo } from "react";
import { FundingField as InvenioFundingField } from "@js/invenio_vocabularies";
import { overrideStore, OverridableContext } from "react-overridable";
import PropTypes from "prop-types";
import { getTitleFromMultilingualObject } from "../../../util";
import { useFieldData } from "../../hooks";

const storeComponents = overrideStore.getAll();

export const FundingField = ({
  overrides,
  label,
  icon = "money bill alternate outline",
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
      <div className="oarepo-funding-field-container">
        <InvenioFundingField
          fieldPath={fieldPath}
          searchConfig={{
            searchApi: {
              axios: {
                headers: {
                  Accept: "application/vnd.inveniordm.v1+json",
                },
                url: "/api/awards",
                withCredentials: false,
              },
            },
            initialQueryState: {
              sortBy: "bestmatch",
              sortOrder: "asc",
              layout: "list",
              page: 1,
              size: 5,
            },
          }}
          deserializeAward={(award) => {
            return {
              title: award.title_l10n,
              number: award.number,
              id: award.id,
              ...(award.identifiers && {
                identifiers: award.identifiers,
              }),
              ...(award.acronym && { acronym: award.acronym }),
            };
          }}
          deserializeFunder={(funder) => {
            return {
              id: funder.id,
              name: funder.name,
              ...(funder.title_l10n && { title: funder.title_l10n }),
              ...(funder.country && { country: funder.country }),
              ...(funder.country_name && {
                country_name: funder.country_name,
              }),
              ...(funder.identifiers && {
                identifiers: funder.identifiers,
              }),
            };
          }}
          computeFundingContents={(funding) => {
            let headerContent,
              descriptionContent,
              awardOrFunder = "";

            if (funding.funder) {
              const funderName =
                funding.funder?.name ??
                funding.funder?.title ??
                funding.funder?.id ??
                "";
              awardOrFunder = "funder";
              headerContent = funderName;
              descriptionContent = "";

              // there cannot be an award without a funder
              if (funding.award) {
                const { acronym, title } = funding.award;
                awardOrFunder = "award";
                descriptionContent = funderName;
                headerContent = acronym
                  ? `${acronym} — ${getTitleFromMultilingualObject(title)}`
                  : getTitleFromMultilingualObject(title);
              }
            }

            return { headerContent, descriptionContent, awardOrFunder };
          }}
          labelIcon={null}
          {...fieldData}
          {...props}
        />
      </div>
    </OverridableContext.Provider>
  );
};

FundingField.propTypes = {
  overrides: PropTypes.object,
  label: PropTypes.string,
  icon: PropTypes.string,
  fieldPath: PropTypes.string.isRequired,
};
