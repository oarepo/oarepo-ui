import React, { useMemo } from "react";
import { FundingField as InvenioFundingField } from "@js/invenio_vocabularies";
import { overrideStore, OverridableContext } from "react-overridable";
import PropTypes from "prop-types";
import { getTitleFromMultilingualObject } from "../../../util";
import { useFieldData } from "../../hooks";
import { deserializeFunder } from "./util";
import { FundingRemoteSelectField } from "./FundingRemoteSelectField";
import { Pagination } from "semantic-ui-react";

const storeComponents = overrideStore.getAll();

const SmallPagination = ({
  currentPage,
  totalResults,
  options,
  currentSize,
  onPageChange,
  maxTotalResults = 10000,
}) => {
  const maxTotalPages = Math.floor(maxTotalResults / currentSize);
  const pages = Math.ceil(totalResults / currentSize);
  const totalDisplayedPages = Math.min(pages, maxTotalPages);
  return (
    <Pagination
      activePage={currentPage}
      size="tiny"
      totalPages={totalDisplayedPages}
      firstItem={null}
      lastItem={null}
      boundaryRange={0}
      siblingRange={3}
      onPageChange={(_, { activePage }) => onPageChange(activePage)}
    />
  );
};

SmallPagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalResults: PropTypes.number.isRequired,
  options: PropTypes.object.isRequired,
  currentSize: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  maxTotalResults: PropTypes.number,
};

export const FundingField = ({
  overrides = {
    "InvenioVocabularies.CustomAwardForm.RemoteSelectField.Container":
      FundingRemoteSelectField,
    "awards.Pagination.element": SmallPagination,
  },
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
          deserializeFunder={deserializeFunder}
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
