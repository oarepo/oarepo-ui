import React, { useState, useContext } from "react";
import { Accordion, Header, Card, Icon, Transition } from "semantic-ui-react";
import PropTypes from "prop-types";
import { AppContext } from "react-searchkit";
import Overridable from "react-overridable";

export const FoldableBucketAggregationElement = ({
  title,
  containerCmp,
  agg,
}) => {
  const [isActive, setIsActive] = useState(false);
  const { buildUID } = useContext(AppContext);

  const handleClick = () => setIsActive((prevState) => !prevState);
  return (
    <Card className="borderless facet foldable rel-ml-1">
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
              {agg.title}
            </Header>
            <div className="align-self-end">
              <Icon name="angle right" />
            </div>
          </div>
        </Accordion.Title>
        <Transition visible={isActive} animation="fade down" duration={200}>
          <Accordion.Content active={isActive}>
            <Overridable
              id={buildUID(`BucketAggregation.element.${agg.aggName}`)}
              aggName={agg.aggName}
              aggTitle={agg.title}
            >
              {containerCmp}
            </Overridable>
          </Accordion.Content>
        </Transition>
      </Accordion>
    </Card>
  );
};

FoldableBucketAggregationElement.propTypes = {
  title: PropTypes.string.isRequired,
  containerCmp: PropTypes.node.isRequired,
};
