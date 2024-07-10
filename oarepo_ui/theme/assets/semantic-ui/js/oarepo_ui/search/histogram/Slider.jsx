import React, { Component } from "react";
import PropTypes from "prop-types";
import { format as d3Format } from "d3-format";

const handleStyle = {
  cursor: "move",
  userSekect: "none",
  MozUserSelect: "none",
  KhtmlUserSelect: "none",
  WebkitUserSelect: "none",
  OUserSelect: "none",
};

// Map keycodes to positive or negative values
export const mapToKeyCode = (code) => {
  const codes = {
    37: -1,
    38: 1,
    39: 1,
    40: -1,
  };
  return codes[code] || null;
};

class Slider extends Component {
  constructor() {
    super();
    this.state = {
      dragging: false,
    };
  }

  componentDidMount() {
    window.addEventListener("mouseup", this.dragEnd, false);
  }

  componentWillUnmount() {
    window.removeEventListener("mouseup", this.dragEnd, false);
  }

  dragStart = (index, e) => {
    e.stopPropagation();
    if (!this.state.dragging) {
      this.setState(
        {
          dragging: true,
          dragIndex: index,
        },
        () => {
          this.props.dragChange(true);
        }
      );
    }
  };

  dragEnd = (e) => {
    e.stopPropagation();
    if (this.state.dragging) {
      this.setState(
        {
          dragging: false,
          dragIndex: null,
        },
        () => {
          this.props.dragChange(false);
          this.props.handleDragEnd();
          //   this.cleanUp();
        }
      );
    }
  };

  cleanUp = () => {
    document.removeEventListener("mouseup", this.dragEnd, false); // Clean up event listener
  };

  dragFromSVG = (e) => {
    if (!this.state.dragging) {
      let selection = [...this.props.selection];
      const selected = this.props.scale.invert(e.nativeEvent.offsetX);
      let dragIndex;

      if (
        Math.abs(selected - selection[0]) > Math.abs(selected - selection[1])
      ) {
        dragIndex = 1;
        selection[1] = Math.max(
          selection[0],
          Math.min(selected, this.props.max)
        );
      } else {
        dragIndex = 0;
        selection[0] = Math.min(
          selection[1],
          Math.max(selected, this.props.min)
        );
      }

      this.props.onChange(selection);
      this.setState(
        {
          dragging: true,
          dragIndex,
        },
        () => {
          this.props.dragChange(true);
        }
      );
    }
  };

  mouseMove = (e) => {
    if (this.state.dragging) {
      let selection = [...this.props.selection];
      let selected = this.props.scale.invert(e.nativeEvent.offsetX);
      let selectedDate = new Date(selected);
      selectedDate.setHours(0, 0, 0, 0); // Set time to midnight
      selected = selectedDate.getTime(); // Convert back to timestamp

      // Check if selected is outside the bounds
      if (selected < this.props.min || selected > this.props.max) {
        return;
      }

      console.log(selected, "selected");

      if (this.state.dragIndex === 0) {
        selection[0] = Math.min(
          selection[1],
          Math.max(selected, this.props.min)
        );
      } else {
        selection[1] = Math.max(
          selection[0],
          Math.min(selected, this.props.max)
        );
      }

      this.props.onChange(selection);
    }
  };

  keyDown = (index, e) => {
    const direction = mapToKeyCode(e.keyCode);
    const { keyboardStep, min, max } = this.props;
    let selection = [...this.props.selection];
    let newValue = selection[index] + direction * keyboardStep;

    if (index === 0) {
      selection[0] = Math.min(selection[1], Math.max(newValue, min));
    } else {
      selection[1] = Math.max(selection[0], Math.min(newValue, max));
    }

    this.props.onChange(selection);
  };
  render() {
    const {
      selection,
      scale,
      format,
      handleLabelFormat,
      formatLabelFunction,
      width,
      height,
      reset,
      innerWidth,
      selectedColor,
      unselectedColor,
      sliderStyle,
      showLabels,
      yCoordinate,
      marginLeft,
      marginRight,
      max,
      min,
    } = this.props;
    console.log(max, min);
    const selectionWidth = Math.abs(scale(selection[1]) - scale(selection[0]));
    const unselectedWidth = Math.abs(scale(max) - scale(min));
    console.log(selectionWidth);
    console.log(Math.abs(scale(max) - scale(min)));
    const f = formatLabelFunction || d3Format(handleLabelFormat);
    return (
      <svg
        style={sliderStyle}
        height={height}
        width={width - marginLeft - marginRight}
        onMouseDown={this.dragFromSVG}
        onDoubleClick={reset}
        onMouseMove={this.mouseMove}
        // transform={`translate(${marginLeft}, 0)`} // This line adds the translation
      >
        <rect
          height={4}
          fill={unselectedColor}
          x={scale(min) + marginLeft}
          y={10}
          width={unselectedWidth}
        />
        <rect
          height={4}
          fill={selectedColor}
          x={scale(selection[0]) + marginLeft}
          y={10}
          width={selectionWidth}
        />
        {selection.map((m, i) => {
          return (
            <g
              tabIndex={0}
              onKeyDown={this.keyDown.bind(this, i)}
              transform={`translate(${this.props.scale(m) + marginLeft}, 0)`}
              key={`handle-${i}`}
              style={{ outline: "none" }}
            >
              <circle
                style={handleStyle}
                r={6}
                cx={0}
                cy={12}
                fill="#ddd"
                strokeWidth="1"
              />
              <circle
                style={handleStyle}
                onMouseDown={this.dragStart.bind(this, i)}
                r={5}
                cx={0}
                cy={12}
                fill="white"
                stroke="#ccc"
                strokeWidth="1"
              />
              {showLabels ? (
                <text
                  style={handleStyle}
                  textAnchor="middle"
                  x={0}
                  y={36}
                  fill="#666"
                  fontSize={12}
                >
                  {f(m, "yyyy", "cs-CZ")}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    );
  }
}

Slider.propTypes = {
  selection: PropTypes.arrayOf(PropTypes.number).isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
  innerWidth: PropTypes.number,
  scale: PropTypes.func,
  reset: PropTypes.func,
  keyboardStep: PropTypes.number,
  dragChange: PropTypes.func,
  onChange: PropTypes.func,
  handleLabelFormat: PropTypes.string,
  formatLabelFunction: PropTypes.func,
  sliderStyle: PropTypes.object,
  showLabels: PropTypes.bool,
  unselectedColor: PropTypes.string,
};

Slider.defaultProps = {
  sliderStyle: {
    display: "block",
    paddingBottom: "8px",
    zIndex: 6,
    overflow: "visible",
  },
  keyboardStep: 1,
  showLabels: true,
  unselectedColor: "gray",
};

export default Slider;
