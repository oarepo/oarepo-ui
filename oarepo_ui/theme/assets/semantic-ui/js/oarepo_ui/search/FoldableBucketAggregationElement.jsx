import { i18next } from "@translations/invenio_search_ui/i18next";
import React, { useState } from "react";
import {
  Accordion,
  Header,
  Button,
  Card,
  Icon,
  Transition,
} from "semantic-ui-react";
import PropTypes from "prop-types";
import { withState } from "react-searchkit";

const FoldableBucketAggregationElementComponent = ({
  currentQueryState,
  agg,
  title,
  containerCmp,
  updateQueryFilters,
  updateQueryState,
}) => {
  const [isActive, setIsActive] = useState(false);

  const clearFacets = (e) => {
    e.stopPropagation();
    if (containerCmp.props.selectedFilters.length) {
      const queryFilters = currentQueryState.filters?.filter(
        (f) => f[0] !== agg.aggName
      );
      updateQueryState({ ...currentQueryState, filters: queryFilters });
      setIsActive(false);
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
            <div className="align-self-end">
              <Icon name="angle right" className="ml-5" />
              {hasSelections() && (
                <Button
                  basic
                  icon
                  size="mini"
                  onClick={(e) => clearFacets(e)}
                  aria-label={i18next.t("Clear selection")}
                  title={i18next.t("Clear selection")}
                >
                  {i18next.t("Clear")}
                </Button>
              )}
            </div>
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

export const FoldableBucketAggregationElement = withState(
  FoldableBucketAggregationElementComponent
);

FoldableBucketAggregationElementComponent.propTypes = {
  agg: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  containerCmp: PropTypes.node,
  updateQueryFilters: PropTypes.func.isRequired,
  updateQueryState: PropTypes.func.isRequired,
  currentQueryState: PropTypes.object.isRequired,
};

FoldableBucketAggregationElementComponent.defaultProps = {
  containerCmp: null,
};
