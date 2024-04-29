import ReactSlider from "react-slider";
import PropTypes from "prop-types";
import React from "react";
import { withState } from "react-searchkit";

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
}) => {
  console.log(currentQueryState.filters);
  let currentFilter;
  let sliderValue = [min, max];
  currentFilter = currentQueryState.filters?.find((f) => f[0] === aggName);
  if (currentFilter) {
    const [start, end] = currentFilter[1].split("/");
    sliderValue = [start ?? min, end ?? max];
  }
  const [sliderValueState, setSliderValueState] = React.useState(sliderValue);
  const handleAfterChange = (value) => {
    if (value === sliderValue) return;
    const filters = currentQueryState.filters.filter((f) => f[0] !== aggName);
    updateQueryState({
      ...currentQueryState,
      filters: [...filters, [aggName, value.join("/")]],
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
        <div className="slider-handle-value">{sliderValueState[0]}</div>
        <div className="slider-handle-value">{sliderValueState[1]}</div>
      </div>
    </React.Fragment>
  );
};

DoubleSliderComponent.propTypes = {
  currentResultsState: PropTypes.object.isRequired,
  currentQueryState: PropTypes.object.isRequired,
  updateQueryState: PropTypes.func.isRequired,
  aggName: PropTypes.string.isRequired,
  sliderValue: PropTypes.arrayOf(PropTypes.number).isRequired,
  handleChange: PropTypes.func.isRequired,
  handleAfterChange: PropTypes.func.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
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
