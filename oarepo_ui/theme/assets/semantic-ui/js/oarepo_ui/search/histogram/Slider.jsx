import React, { Component } from "react";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";

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
    const element = document.getElementById(this.props.aggName);
    if (element) {
      element.addEventListener("mouseup", (e) => this.dragEnd(e));
      element.addEventListener("keyup", (e) => this.handleKeyUp(e, 1000));
    }
  }

  componentWillUnmount() {
    const element = document.getElementById(this.props.aggName);
    if (element) {
      element.removeEventListener("mouseup", this.dragEnd);
      element.removeEventListener("keyup", this.dragEnd);
    }
  }

  dragStart = (index, e) => {
    e.stopPropagation();
    if (!this.state.dragging) {
      this.setState(
        {
          dragging: true,
          dragIndex: index,
        },
        () => {}
      );
    }
  };

  handleKeyUp = (e, delay) => {
    clearTimeout(this.dragEndTimeout);

    let timeDelay = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      timeDelay = delay;
    }

    this.dragEndTimeout = setTimeout(() => {
      this.dragEnd(e);
    }, timeDelay);
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
          this.props.handleDragEnd();
        }
      );
    }
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
        () => {}
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

      if (selected <= this.props.min) {
        selected = this.props.min;
      } else if (selected >= this.props.max) {
        selected = this.props.max;
      }

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
    this.setState({ dragging: true, dragIndex: index });
    const { min, max, diffFunc } = this.props;

    const keyboardStep = (max - min) / diffFunc(max, min);

    const direction = mapToKeyCode(e.keyCode);
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
      formatLabelFunction,
      width,
      height,
      reset,
      showLabels,
      marginLeft,
      marginRight,
      max,
      min,
      formatString,
      aggName,
    } = this.props;
    const selectionWidth = Math.abs(scale(selection[1]) - scale(selection[0]));
    const unselectedWidth = Math.abs(scale(max) - scale(min));
    return (
      <svg
        id={aggName}
        height={height}
        width={width - marginLeft - marginRight}
        onMouseDown={this.dragFromSVG}
        onDoubleClick={reset}
        onMouseMove={this.mouseMove}
      >
        <rect
          className="unselected-slider"
          x={scale(min) + marginLeft}
          y={10}
          width={unselectedWidth}
        />
        <rect
          className="selected-slider"
          x={scale(selection[0]) + marginLeft}
          y={10}
          width={selectionWidth}
        />
        {selection.map((m, i) => {
          return (
            <g
              className="thumb-svg-group"
              tabIndex={0}
              onKeyDown={this.keyDown.bind(this, i)}
              transform={`translate(${this.props.scale(m) + marginLeft}, 0)`}
              key={`handle-${i}`}
            >
              {/* <circle
                style={handleStyle}
                r={6}
                cx={0}
                cy={12}
                fill="#ddd"
                strokeWidth="1"
              /> */}
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
                  {formatLabelFunction(m, formatString, i18next.language)}
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
  scale: PropTypes.func,
  reset: PropTypes.func,
  keyboardStep: PropTypes.number,
  onChange: PropTypes.func,
  formatLabelFunction: PropTypes.func,
  showLabels: PropTypes.bool,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  aggName: PropTypes.string.isRequired,
  handleDragEnd: PropTypes.func.isRequired,
  marginLeft: PropTypes.number.isRequired,
  marginRight: PropTypes.number.isRequired,
  formatString: PropTypes.string.isRequired,
};

Slider.defaultProps = {
  keyboardStep: 1,
  showLabels: true,
};

export default Slider;
