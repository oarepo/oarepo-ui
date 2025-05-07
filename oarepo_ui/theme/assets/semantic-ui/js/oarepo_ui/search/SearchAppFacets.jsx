import React from "react";
import { BucketAggregation, Toggle } from "react-searchkit";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { ErrorBoundary } from "../components/ErrorBoundary";

export const SearchAppFacets = ({ aggs, appName, allVersionsToggle }) => {
  return (
    <div className="facets-container">
      <div className="facet-list">
        {allVersionsToggle && (
          <Toggle
            title={i18next.t("Versions")}
            label={i18next.t("View all versions")}
            filterValue={["allversions", "true"]}
          />
        )}
        {aggs.map((agg) => (
          <ErrorBoundary
            fallback={<div>{i18next.t("Error loading facet")}</div>}
            key={agg.aggName}
          >
            <BucketAggregation key={agg.aggName} title={agg.title} agg={agg} />
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
};

SearchAppFacets.propTypes = {
  aggs: PropTypes.array.isRequired,
  appName: PropTypes.string.isRequired,
  allVersionsToggle: PropTypes.bool,
};

SearchAppFacets.defaultProps = {
  allVersionsToggle: false,
};
