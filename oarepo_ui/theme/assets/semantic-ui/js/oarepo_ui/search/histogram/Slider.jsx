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

  dragFromSVG = (e, scale) => {
    if (!this.state.dragging) {
      let selection = [...this.props.selection];
      const selected = scale.invert(
        e.nativeEvent.offsetX - this.props.marginLeft
      );
      let dragIndex;

      if (
        Math.abs(selected - selection[0]) >= Math.abs(selected - selection[1])
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

  mouseMove = (e, scale) => {
    if (this.state.dragging) {
      let selection = [...this.props.selection];
      let selected = scale.invert(
        e.nativeEvent.offsetX - this.props.marginLeft
      );

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
      formatLabelFunction,
      width,
      height,
      showLabels,
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
              key={`handle-${i}`}
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
  selection: PropTypes.arrayOf(PropTypes.number).isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
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
  diffFunc: PropTypes.func.isRequired,
};
