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
import _get from "lodash/get";
import { getAddFunc, getDiffFunc, getFormatString } from "./utils";
import { EDTFDaterangePicker } from "./Datepicker";
import { Formik } from "formik";

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
  // const MIN_DATE = new Date(_getResultsStats(aggregations, minDateAggName));
  // const MAX_DATE = new Date(_getResultsStats(aggregations, maxDateAggName));
  const MIN_DATE = new Date(
    "Tue Jan 01 1924 01:00:00 GMT+0100 (Central European Standard Time"
  );
  const MAX_DATE = new Date(
    "Mon Jan 01 2024 01:00:00 GMT+0100 (Central European Standard Time)"
  );
  const histogramInterval = _get(aggregations, aggName, {})?.interval;

  const addFunc = getAddFunc(histogramInterval);
  const diffFunc = getDiffFunc(histogramInterval);
  const formatString = getFormatString(histogramInterval);
  const MIN_SLIDER_VALUE = 0;
  const MAX_SLIDER_VALUE = diffFunc(MAX_DATE, MIN_DATE);
  let currentFilter;
  currentFilter =
    currentQueryState.filters?.find((f) => f[0] === aggName) ||
    "1924-01-01/2024-01-01";

  let histogramData = _getResultBuckets(aggregations, aggName).map((d) => {
    return {
      ...d,
      start: new Date(d.start),
      end: new Date(d.end),
      // as you narrow the range, sometimes buckets would have the same key i.e. same day
      uuid: crypto.randomUUID(),
    };
  });
  useLoadLocaleObjects();
  return (
    <Formik initialValues={{ fromto: currentFilter }}>
      {histogramData?.length > 0 && (
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
            />
            <EDTFDaterangePicker
              fieldPath="fromto"
              updateQueryState={updateQueryState}
              currentQueryState={currentQueryState}
              aggName={aggName}
            />
          </Card.Content>
        </Card>
      )}
    </Formik>
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
