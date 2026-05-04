import React from "react";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Message, MessageHeader, Icon } from "semantic-ui-react";

export const SearchAppFacetFallback = ({ error, agg }) => (
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

SearchAppFacetFallback.propTypes = {
  error: PropTypes.instanceOf(Error).isRequired,
  agg: PropTypes.shape({
    aggName: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    field: PropTypes.string.isRequired,
  }).isRequired,
};
