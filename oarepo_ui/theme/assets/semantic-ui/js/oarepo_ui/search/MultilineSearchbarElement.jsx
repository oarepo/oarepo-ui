// no multiple options search bar

import React, { useState } from "react";
import PropTypes from "prop-types";
import { withState } from "react-searchkit";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Button, Icon } from "semantic-ui-react";
import TextareaAutosize from "react-textarea-autosize";

export const MultilineSearchbarElement = withState(
  ({
    queryString,
    onInputChange,
    updateQueryState,
    currentQueryState,
    iconName = "search",
    iconColor,
    placeholder: passedPlaceholder = i18next.t("Search"),
    actionProps,
  }) => {
    const initialMaxRows = 10; // Default maximum number of rows for the textarea
    const placeholder = passedPlaceholder || i18next.t("Search");

    const [textAreaMaxRows, setTextAreaMaxRows] = useState(1);

    const onSearch = () => {
      updateQueryState({ ...currentQueryState, queryString, page: 1 });
    };

    const onKeyDown = (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        onSearch();
      }
    };

    const handleInputChange = (event) => {
      onInputChange(event.target.value);
    };

    const handleClear = () => {
      onInputChange("");
    };

    const handleFocus = (event) => {
      setTextAreaMaxRows(initialMaxRows); // Expand to multiple lines when focused
      event.target.removeAttribute("title");
    };

    const handleBlur = (event) => {
      setTextAreaMaxRows(1); // Reset to single line when blurred
      event.target.setAttribute(
        "title",
        `${i18next.t("Search")}: ${event.target.value}`
      ); // Set title for tooltip effect
    };

    return (
      <div className="ui fluid action icon input">
        <div className="textarea-container">
          <TextareaAutosize
            className="ui multiline-textarea"
            placeholder={placeholder}
            aria-label={placeholder}
            value={queryString}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            minRows={1}
            maxRows={textAreaMaxRows}
          />
          {queryString && (
            <div className="textarea-overlay" aria-hidden>
              {queryString}
            </div>
          )}
        </div>
        {queryString && (
          <Button
            basic
            icon="close"
            className="clear-button"
            onClick={handleClear}
            title={i18next.t("Clear")}
          />
        )}
        <Button
          type="submit"
          icon
          className="search"
          color={iconColor}
          onClick={onSearch}
          aria-label={i18next.t("Search")}
          {...actionProps}
        >
          <Icon name={iconName} />
        </Button>
      </div>
    );
  }
);

MultilineSearchbarElement.propTypes = {
  placeholder: PropTypes.string,
  queryString: PropTypes.string,
  onInputChange: PropTypes.func,
  updateQueryState: PropTypes.func,
  currentQueryState: PropTypes.object,
  iconName: PropTypes.string,
  iconColor: PropTypes.string,
};
