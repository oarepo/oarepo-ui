import React from "react";
import _get from "lodash/get";
import Overridable, { overrideStore } from "react-overridable";
import { AppContext } from "react-searchkit";

export const FallbackItemComponent = ({ result }) => (
  <div>
    <h2>{result.id}</h2>
  </div>
);

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

export default DynamicResultsListItem;
