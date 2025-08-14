import React from "react";
import _get from "lodash/get";
import Overridable from "react-overridable";
import { AppContext } from "react-searchkit";
import PropTypes from "prop-types";

export const FallbackItemComponent = ({ result }) => (
  <div>
    <h2>{result.id}</h2>
  </div>
);

FallbackItemComponent.propTypes = {
  result: PropTypes.object.isRequired,
};

export const DynamicResultsListItem = ({
  result,
  selector = "$schema",
  FallbackComponent = FallbackItemComponent,
}) => {
  const { buildUID } = React.useContext(AppContext);
  const selectorValue = _get(result, selector);

  if (!selectorValue) {
    console.warn("Result", result, `is missing value for '${selector}'.`);
    return <FallbackComponent result={result} />;
  }
  return (
    <Overridable
      id={buildUID("ResultsList.item", selectorValue)}
      result={result}
    >
      <FallbackComponent result={result} />
    </Overridable>
  );
};

DynamicResultsListItem.propTypes = {
  result: PropTypes.object.isRequired,
  // eslint-disable-next-line react/require-default-props
  selector: PropTypes.string,
  // eslint-disable-next-line react/require-default-props
  FallbackComponent: PropTypes.elementType,
};

export default DynamicResultsListItem;
