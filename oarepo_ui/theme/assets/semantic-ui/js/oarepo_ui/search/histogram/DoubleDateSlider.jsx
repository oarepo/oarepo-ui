import ReactSlider from "react-slider";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { withState } from "react-searchkit";
import { addDays, differenceInDays } from "date-fns";
import { formatDate } from "@js/oarepo_ui";
import { i18next } from "@translations/oarepo_ui/i18next";

const DoubleDateSliderComponent = ({
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
  const currentStartDate = formatDate(
    addDays(minDate, sliderValueState[0]),
    "PPP",
    i18next.language
  );
  const currentEndDate = formatDate(
    addDays(minDate, sliderValueState[1]),
    "PPP",
    i18next.language
  );
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
    const currentStartDate = formatDate(
      addDays(minDate, value[0]),
      "yyyy-MM-dd"
    );
    const currentEndDate = formatDate(addDays(minDate, value[1]), "yyyy-MM-dd");

    updateQueryState({
      ...currentQueryState,
      filters: [...filters, [aggName, `${currentStartDate}/${currentEndDate}`]],
    });
  };
  return (
    <div className="ui horizontal-slider-bla">
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
    </div>
  );
};

DoubleDateSliderComponent.propTypes = {
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

DoubleDateSliderComponent.defaultProps = {
  className: "horizontal-slider",
  thumbClassName: "thumb",
  trackClassName: "track",
};

export const DoubleDateSlider = withState(DoubleDateSliderComponent);
