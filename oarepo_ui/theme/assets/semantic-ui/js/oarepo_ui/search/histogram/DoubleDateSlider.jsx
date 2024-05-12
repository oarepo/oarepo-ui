import ReactSlider from "react-slider";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
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
  console.log(sliderValueState);
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
  // Need the use effect to keep the slider in sync with the selected filters i.e.
  // in case user deletes the filters or for example applies a filter by clicking on a histogram bar
  // I simply dont see a reasonable way to include sliderValue in dependency array without
  // causing strange behavior
  useEffect(() => {
    console.log("useEffect", sliderValue);
    setSliderValueState(sliderValue);
  }, [currentFilter]);

  return (
    <div className="ui horizontal-slider">
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
  className: "slider",
  thumbClassName: "thumb",
  trackClassName: "track",
};

export const DoubleDateSlider = withState(DoubleDateSliderComponent);
