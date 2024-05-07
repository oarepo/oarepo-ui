import React from "react";
import { Histogram } from "./Histogram";
import { DoubleDateSlider } from "./DoubleDateSlider";
import { withState } from "react-searchkit";
import {
  useLoadLocaleObjects,
  _getResultsStats,
  _getResultBuckets,
} from "@js/oarepo_ui";
import { differenceInDays } from "date-fns";
import PropTypes from "prop-types";
import { Card } from "semantic-ui-react";



// TODO:
// 9. when there is only one bar display it in a nice way

const HistogramComponent = ({
  currentResultsState: {
    data: { aggregations },
  },
  currentQueryState,
  updateQueryState,
  aggName,
  aggTitle,
  minDateAggName,
  maxDateAggName,
}) => {
  const MIN_DATE = new Date(_getResultsStats(aggregations, minDateAggName));
  const MAX_DATE = new Date(_getResultsStats(aggregations, maxDateAggName));

  const MIN_SLIDER_VALUE = 0;
  const MAX_SLIDER_VALUE = differenceInDays(MAX_DATE, MIN_DATE);

  const histogramData = _getResultBuckets(aggregations, aggName).map((d) => {
    return {
      ...d,
      key: new Date(d.key),
      // as you narrow the range, sometimes buckets would have the same key i.e. same day
      uuid: crypto.randomUUID(),
    };
  });

  useLoadLocaleObjects();
  return (
    histogramData?.length > 0 && (
      <Card className="borderless facet">
        <Card.Content>
          <Card.Header as="h2">{aggTitle}</Card.Header>
          <Histogram
            histogramData={histogramData}
            svgHeight={250}
            rectangleClassName={"histogram-rectangle"}
            updateQueryState={updateQueryState}
            currentQueryState={currentQueryState}
            aggName={aggName}
          />
          <DoubleDateSlider
            aggName={aggName}
            thumbClassName="thumb"
            trackClassName="track"
            ariaLabel={["Lower thumb", "Upper thumb"]}
            ariaValuetext={(state) => `Thumb value ${state.valueNow}`}
            min={MIN_SLIDER_VALUE}
            max={MAX_SLIDER_VALUE}
            minDate={MIN_DATE}
            maxDate={MAX_DATE}
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
};
export const HistogramWSlider = withState(HistogramComponent);
