import React from "react";
import { Histogram } from "./Histogram";
import { DoubleDateSlider } from "./DoubleDateSlider";
import { withState } from "react-searchkit";
import {
  useLoadLocaleObjects,
  _getResultsStats,
  _getResultBuckets,
} from "@js/oarepo_ui";
import PropTypes from "prop-types";
import { Card } from "semantic-ui-react";
import { getAddFunc, getDiffFunc, getFormatString } from "./utils";
import _get from "lodash/get";

const HistogramComponent = ({
  currentResultsState: {
    data: { aggregations },
  },
  currentQueryState,
  updateQueryState,
  aggName,
  aggTitle,
  minimumInterval,

  minDateAggName,
  maxDateAggName,
}) => {
  // const MIN_DATE = new Date(_getResultsStats(aggregations, minDateAggName));
  // const MAX_DATE = new Date(_getResultsStats(aggregations, maxDateAggName));
  const MIN_DATE = new Date(
    "Tue Jan 01 1924 01:00:00 GMT+0100 (Central European Standard Time"
  );
  const MAX_DATE = new Date(
    "Mon Jan 01 2024 01:00:00 GMT+0100 (Central European Standard Time)"
  );
  const addFunc = getAddFunc(minimumInterval);
  const diffFunc = getDiffFunc(minimumInterval);
  // if we send yyyy/yyyy to the url or yyyy-MM-dd/yyyy-MM-dd
  const facetDateFormat = minimumInterval === "year" ? "yyyy" : "yyyy-MM-dd";
  const histogramInterval = _get(aggregations, aggName, {})?.interval;

  const formatString = getFormatString(minimumInterval);
  const MIN_SLIDER_VALUE = 0;
  const MAX_SLIDER_VALUE = diffFunc(MAX_DATE, MIN_DATE);

  let histogramData = _getResultBuckets(aggregations, aggName).map((d) => {
    return {
      ...d,
      start: new Date(d.start),
      // hack to fix the end issue, should be fixed in BE
      end: new Date(d.end ?? d.start),
      // as you narrow the range, sometimes buckets would have the same key i.e. same day
      uuid: crypto.randomUUID(),
    };
  });
  useLoadLocaleObjects();
  return (
    histogramData?.length > 0 && (
      <Card className="borderless facet">
        <Card.Content>
          <Histogram
            histogramData={histogramData}
            svgHeight={300}
            rectangleClassName={"histogram-rectangle"}
            updateQueryState={updateQueryState}
            currentQueryState={currentQueryState}
            aggName={aggName}
            formatString={formatString}
            facetDateFormat={facetDateFormat}
          />
          <DoubleDateSlider
            addFunc={addFunc}
            diffFunc={diffFunc}
            formatString={formatString}
            aggName={aggName}
            thumbClassName="thumb"
            trackClassName="track"
            ariaLabel={["Lower thumb", "Upper thumb"]}
            ariaValuetext={(state) => `Thumb value ${state.valueNow}`}
            min={MIN_SLIDER_VALUE}
            max={MAX_SLIDER_VALUE}
            minDate={MIN_DATE}
            maxDate={MAX_DATE}
            facetDateFormat={facetDateFormat}
            histogramDataLength={histogramData.length}
          />
        </Card.Content>
      </Card>
    )
  );
};

HistogramComponent.propTypes = {
  currentResultsState: PropTypes.object.isRequired,
  currentQueryState: PropTypes.object.isRequired,
  updateQueryState: PropTypes.func.isRequired,
  aggName: PropTypes.string.isRequired,
  aggTitle: PropTypes.string.isRequired,
  minDateAggName: PropTypes.string.isRequired,
  maxDateAggName: PropTypes.string.isRequired,
  minimumInterval: PropTypes.oneOf(["year", "day"]),
};
// TODO: fix up layout for daily granularity
HistogramComponent.defaultProps = {
  minimumInterval: "year",
};
export const HistogramWSlider = withState(HistogramComponent);
