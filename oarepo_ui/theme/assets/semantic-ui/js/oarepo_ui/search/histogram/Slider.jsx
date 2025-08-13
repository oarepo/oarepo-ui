import React, { Component } from "react";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import * as d3 from "d3";

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

export class Slider extends Component {
  constructor() {
    super();
    this.state = {
      dragging: false,
    };
  }

  componentDidMount() {
    const { aggName } = this.props;

    const element = document.getElementById(aggName);
    if (element) {
      element.addEventListener("mouseup", (e) => this.dragEnd(e));
      element.addEventListener("keyup", (e) => this.handleKeyUp(e, 1000));
    }
  }

  componentWillUnmount() {
    const { aggName } = this.props;

    const element = document.getElementById(aggName);
    if (element) {
      element.removeEventListener("mouseup", this.dragEnd);
      element.removeEventListener("keyup", this.dragEnd);
    }
  }

  dragStart = (index, e) => {
    const { dragging } = this.state;

    e.stopPropagation();
    if (!dragging) {
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
    const { handleDragEnd } = this.props;
    const { dragging } = this.state;

    e.stopPropagation();
    if (dragging) {
      this.setState(
        {
          dragging: false,
          dragIndex: null,
        },
        () => {
          handleDragEnd();
        }
      );
    }
  };

  dragFromSVG = (e, scale) => {
    const { selection, marginLeft, min, max, onChange = () => {} } = this.props;
    const { dragging } = this.state;

    if (!dragging) {
      let _selection = [...selection];
      const selected = scale.invert(e.nativeEvent.offsetX - marginLeft);
      let dragIndex;

      if (
        Math.abs(selected - _selection[0]) >= Math.abs(selected - _selection[1])
      ) {
        dragIndex = 1;
        _selection[1] = Math.max(_selection[0], Math.min(selected, max));
      } else {
        dragIndex = 0;
        _selection[0] = Math.min(_selection[1], Math.max(selected, min));
      }

      onChange(_selection);
      this.setState(
        {
          dragging: true,
          dragIndex,
        },
        () => {}
      );
    }
  };

  mouseMove = (e, scale) => {
    const { selection, marginLeft, min, max, onChange = () => {} } = this.props;
    const { dragging, dragIndex } = this.state;

    if (dragging) {
      let _selection = [...selection];
      let selected = scale.invert(e.nativeEvent.offsetX - marginLeft);

      if (selected <= min) {
        selected = min;
      } else if (selected >= max) {
        selected = max;
      }

      if (dragIndex === 0) {
        _selection[0] = Math.min(_selection[1], Math.max(selected, min));
      } else {
        _selection[1] = Math.max(_selection[0], Math.min(selected, max));
      }

      onChange(_selection);
    }
  };

  keyDown = (index, e) => {
    const { selection, onChange = () => {} } = this.props;

    this.setState({ dragging: true, dragIndex: index });
    const { min, max, diffFunc } = this.props;

    const keyboardStep = (max - min) / diffFunc(max, min);

    const direction = mapToKeyCode(e.keyCode);
    let _selection = [...selection];
    let newValue = _selection[index] + direction * keyboardStep;
    if (index === 0) {
      _selection[0] = Math.min(_selection[1], Math.max(newValue, min));
    } else {
      _selection[1] = Math.max(_selection[0], Math.min(newValue, max));
    }

    onChange(_selection);
  };
  render() {
    const {
      selection,
      formatLabelFunction = (x) => x,
      width = 400,
      height = 80,
      showLabels = true,
      marginLeft,
      marginRight,
      max,
      min,
      formatString,
      aggName,
    } = this.props;
    const scale = d3
      .scaleLinear()
      .domain([min, max])
      .range([marginLeft, width - marginRight]);

    const selectionWidth = Math.abs(scale(selection[1]) - scale(selection[0]));
    const unselectedWidth = Math.abs(scale(max) - scale(min));

    return (
      <svg
        id={aggName}
        height={height}
        viewBox={`${marginLeft} 0 ${width} ${height}`}
        onMouseDown={(e) => this.dragFromSVG(e, scale)}
        onMouseUp={this.dragEnd}
        onMouseMove={(e) => this.mouseMove(e, scale)}
      >
        <rect
          className="unselected-slider"
          x={scale(min) + marginLeft}
          y={14}
          width={unselectedWidth}
        />
        <rect
          className="selected-slider"
          x={scale(selection[0]) + marginLeft}
          y={14}
          width={selectionWidth}
        />
        {selection.map((m, i) => {
          return (
            <g
              className="slider-thumb-container"
              transform={`translate(${scale(m) + marginLeft}, 0)`}
              key={`handle-${m}`}
            >
              <circle
                className="slider-thumb"
                tabIndex={0}
                onKeyDown={this.keyDown.bind(this, i)}
                onMouseDown={this.dragStart.bind(this, i)}
                r={8}
                cx={0}
                cy={16}
              />
              {showLabels ? (
                <text className="slider-thumb-label" x={0} y={48}>
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
  /* eslint-disable react/require-default-props */
  height: PropTypes.number,
  width: PropTypes.number,
  onChange: PropTypes.func,
  formatLabelFunction: PropTypes.func,
  showLabels: PropTypes.bool,
  /* eslint-enable react/require-default-props */
  selection: PropTypes.arrayOf(PropTypes.number).isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  aggName: PropTypes.string.isRequired,
  handleDragEnd: PropTypes.func.isRequired,
  marginLeft: PropTypes.number.isRequired,
  marginRight: PropTypes.number.isRequired,
  formatString: PropTypes.string.isRequired,
  diffFunc: PropTypes.func.isRequired,
};
