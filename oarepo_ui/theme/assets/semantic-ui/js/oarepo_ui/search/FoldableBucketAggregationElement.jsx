import { i18next } from "@translations/invenio_search_ui/i18next";
import React, { useState } from "react";
import {
  Accordion,
  Header,
  Button,
  Card,
  Icon,
  Checkbox,
  Label,
  List,
  Transition,
} from "semantic-ui-react";
import Overridable from "react-overridable";
import PropTypes from "prop-types";
import { BucketAggregation, Toggle, buildUID } from "react-searchkit";

export const FoldableBucketAggregationElement = ({
  agg,
  title,
  containerCmp,
  updateQueryFilters,
}) => {
  const [isActive, setIsActive] = useState(false);

  const clearFacets = () => {
    if (containerCmp.props.selectedFilters.length) {
      updateQueryFilters([agg.aggName, ""], containerCmp.props.selectedFilters);
    }
  };

  const hasSelections = () => {
    return !!containerCmp.props.selectedFilters.length;
  };
  const handleClick = () => setIsActive((prevState) => !prevState);
  return (
    <Card className="borderless facet rel-ml-1">
      <Accordion>
        <Accordion.Title
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleClick();
            }
          }}
          tabIndex={0}
          active={isActive}
          onClick={handleClick}
        >
          <div className="flex justify-space-between align-items-center">
            <Header className="mb-0" as="h3">
              {title}
            </Header>
            <Icon name="angle right" className="ml-5" align-self-end />

            {hasSelections() && (
              <Button
                inline
                basic
                icon
                size="mini"
                // floated="right"
                onClick={clearFacets}
                aria-label={i18next.t("Clear selection")}
                title={i18next.t("Clear selection")}
                className="align-self-end"
              >
                {i18next.t("Clear")}
              </Button>
            )}
          </div>
        </Accordion.Title>
        <Transition visible={isActive} animation="fade down" duration={200}>
          <Accordion.Content active={isActive}>
            {containerCmp}
          </Accordion.Content>
        </Transition>
      </Accordion>
    </Card>
  );
};

FoldableBucketAggregationElement.propTypes = {
  agg: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  containerCmp: PropTypes.node,
  updateQueryFilters: PropTypes.func.isRequired,
};

FoldableBucketAggregationElement.defaultProps = {
  containerCmp: null,
};
