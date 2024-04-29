import ReactSlider from "react-slider";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { withState } from "react-searchkit";
import { addDays, format, differenceInDays } from "date-fns";
import { cs } from "date-fns/locale";

const DoubleSliderComponent = ({
  currentResultsState,
  currentQueryState,
  updateQueryState,
  aggName,
  min,
  max,
  className,
  thumbClassName,
  trackClassName,
  minDate,
  maxDate,
}) => {
  let currentFilter;
  let sliderValue = [min, max];
  currentFilter = currentQueryState.filters?.find((f) => f[0] === aggName);
  if (currentFilter) {
    const [start, end] = currentFilter[1].split("/");
    sliderValue = [
      start ? differenceInDays(new Date(start), minDate) : min,
      end ? differenceInDays(new Date(end), minDate) : max,
    ];
  }
  const [sliderValueState, setSliderValueState] = useState(sliderValue);
  const currentStartDate = format(
    addDays(minDate, sliderValueState[0]),
    "PPP",
    { locale: cs }
  );
  const currentEndDate = format(addDays(minDate, sliderValueState[1]), "PPP", {
    locale: cs,
  });
  const handleAfterChange = (value) => {
    if (value === sliderValue) return;
    const filters = currentQueryState.filters.filter((f) => f[0] !== aggName);
    if (value[0] === min && value[1] === max) {
      updateQueryState({
        ...currentQueryState,
        filters: filters,
      });
      return;
    }
    const currentStartDate = format(addDays(minDate, value[0]), "yyyy-MM-dd");
    const currentEndDate = format(addDays(minDate, value[1]), "yyyy-MM-dd");

    updateQueryState({
      ...currentQueryState,
      filters: [...filters, [aggName, `${currentStartDate}/${currentEndDate}`]],
    });
  };
  return (
    <React.Fragment>
      <ReactSlider
        value={sliderValueState}
        className={className}
        thumbClassName={thumbClassName}
        trackClassName={trackClassName}
        onChange={(value) => {
          setSliderValueState(value);
        }}
        onAfterChange={handleAfterChange}
        ariaLabel={["Lower thumb", "Upper thumb"]}
        ariaValuetext={(state) => `Thumb value ${state.valueNow}`}
        min={min}
        max={max}
      />
      <div className="slider-values">
        <div className="slider-handle-value">{currentStartDate}</div>
        <div className="slider-handle-value">{currentEndDate}</div>
      </div>
    </React.Fragment>
  );
};

DoubleSliderComponent.propTypes = {
  currentResultsState: PropTypes.object.isRequired,
  currentQueryState: PropTypes.object.isRequired,
  updateQueryState: PropTypes.func.isRequired,
  aggName: PropTypes.string.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  minDate: PropTypes.instanceOf(Date).isRequired,
  maxDate: PropTypes.instanceOf(Date).isRequired,
  className: PropTypes.string,
  thumbClassName: PropTypes.string,
  trackClassName: PropTypes.string,
};

DoubleSliderComponent.defaultProps = {
  className: "horizontal-slider",
  thumbClassName: "thumb",
  trackClassName: "track",
};

export const DoubleSlider = withState(DoubleSliderComponent);
