import React from "react";
import _get from "lodash/get";
import Overridable from "react-overridable";
import { AppContext, buildUID as searchkitBuildUID } from "react-searchkit";
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
  appName,
}) => {
  const SearchAppContext = React.useContext(AppContext);
  const buildUID =
    SearchAppContext?.buildUID ||
    ((element, overrideId) => searchkitBuildUID(element, overrideId, appName));

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
  appName: PropTypes.string,
};

export default DynamicResultsListItem;
