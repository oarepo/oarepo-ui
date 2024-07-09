import ReactSlider from "react-slider";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import { withState } from "react-searchkit";
import { formatDate } from "@js/oarepo_ui";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Icon, Button } from "semantic-ui-react";
import { calculateZoomIn, calculateZoomOut } from "./utils";

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
  addFunc,
  diffFunc,
  formatString,
  facetDateFormat,
  histogramDataLength,
}) => {
  const currentFilter = currentQueryState.filters?.find(
    (f) => f[0] === aggName
  );
  let sliderValue = [min, max];
  if (currentFilter) {
    const [start, end] = currentFilter[1].split("/");
    sliderValue = [
      start ? diffFunc(new Date(start), minDate) : min,
      end ? diffFunc(new Date(end), minDate) : max,
    ];
  }

  const [sliderValueState, setSliderValueState] = useState(sliderValue);
  const [sliderMin, setSliderMin] = useState(min);
  const [sliderMax, setSliderMax] = useState(max);

  const currentStartDate = formatDate(
    addFunc(minDate, sliderValueState[0]),
    formatString,
    i18next.language
  );

  const currentEndDate = formatDate(
    addFunc(minDate, sliderValueState[1]),
    formatString,
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
      addFunc(minDate, value[0]),
      facetDateFormat
    );
    const currentEndDate = formatDate(
      addFunc(minDate, value[1]),
      facetDateFormat
    );

    if (sliderValue[0] !== value[0]) {
      setSliderMin(sliderValueState[0]);
    }
    if (sliderValue[1] !== value[1]) {
      setSliderMax(sliderValueState[1]);
    }
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
    setSliderValueState(sliderValue);
    setSliderMin(sliderValue[0]);
    setSliderMax(sliderValue[1]);
  }, [currentQueryState.filters, min, max]);

  return (
    <div className="ui horizontal-slider">
      {histogramDataLength > 1 && (
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
          min={sliderMin}
          max={sliderMax}
        />
      )}
      <div className="slider-values">
        <div className="slider-handle-value">{currentStartDate}</div>
        {(sliderMin !== min || sliderMax !== max) && (
          <Button
            type="button"
            aria-label={i18next.t("Zoom out")}
            title={i18next.t("Zoom out")}
            className="transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleAfterChange(
                  calculateZoomOut(sliderMin, sliderMax, min, max)
                );
              }
            }}
            onClick={() => {
              handleAfterChange(
                calculateZoomOut(sliderMin, sliderMax, min, max)
              );
            }}
          >
            <Icon className="m-0" aria-hidden="true" name="zoom-out" />
          </Button>
        )}
        {sliderMax - sliderMin > Math.ceil(0.2 * max) && (
          <Button
            type="button"
            aria-label={i18next.t("Zoom in")}
            title={i18next.t("Zoom in")}
            className="transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleAfterChange(
                  calculateZoomIn(sliderMin, sliderMax, min, max)
                );
              }
            }}
            onClick={() => {
              handleAfterChange(
                calculateZoomIn(sliderMin, sliderMax, min, max)
              );
            }}
          >
            <Icon className="m-0" aria-hidden="true" name="zoom-in" />
          </Button>
        )}
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
  className: PropTypes.string,
  thumbClassName: PropTypes.string,
  trackClassName: PropTypes.string,
  addFunc: PropTypes.func.isRequired,
  diffFunc: PropTypes.func.isRequired,
  formatString: PropTypes.string.isRequired,
  facetDateFormat: PropTypes.string.isRequired,
};

DoubleDateSliderComponent.defaultProps = {
  className: "slider",
  thumbClassName: "thumb",
  trackClassName: "track",
};

export const DoubleDateSlider = withState(DoubleDateSliderComponent);
