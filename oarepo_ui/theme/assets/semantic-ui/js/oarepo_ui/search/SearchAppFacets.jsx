import React from "react";
import { BucketAggregation, Toggle } from "react-searchkit";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { ErrorBoundary } from "react-error-boundary";
import { Message, MessageHeader, Icon } from "semantic-ui-react";

const SearchAppFacetsFallback = ({ error, agg }) => (
  <Message error attached="bottom">
    <MessageHeader>
      <Icon name="warning sign" color="red" />
      {i18next.t("Something went wrong")}
    </MessageHeader>
    <p>
      {i18next.t("Unable to load {{facet}} filter options", {
        facet: agg.title,
      })}
    </p>
    <p>
      {i18next.t(
        "Please refresh the page, or contact support if the problem continues."
      )}
    </p>
    <p>
      {i18next.t("Error")}: <code>{error.message}</code>
    </p>
  </Message>
);

SearchAppFacetsFallback.propTypes = {
  error: PropTypes.instanceOf(Error).isRequired,
  agg: PropTypes.shape({
    aggName: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    field: PropTypes.string.isRequired,
  }).isRequired,
};

export const SearchAppFacets = ({
  aggs,
  appName,
  allVersionsToggle = false,
}) => {
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
            FallbackComponent={(props) => (
              <SearchAppFacetsFallback {...props} agg={agg} />
            )}
            key={agg.aggName}
          >
            <BucketAggregation key={agg.aggName} title={agg.titles} agg={agg} />
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
};

SearchAppFacets.propTypes = {
  aggs: PropTypes.array.isRequired,
  appName: PropTypes.string.isRequired,
  // eslint-disable-next-line react/require-default-props
  allVersionsToggle: PropTypes.bool,
};
