// no multiple options search bar

import React, { useState } from "react";
import PropTypes from "prop-types";
import { withState } from "react-searchkit";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Button, Icon } from "semantic-ui-react";
import TextareaAutosize from 'react-textarea-autosize';

export const SearchappSearchbarElement = withState(
  ({
    queryString,
    onInputChange,
    updateQueryState,
    currentQueryState,
    iconName,
    iconColor,
    placeholder: passedPlaceholder,
    actionProps,
  }) => {
    const initialMaxRows = 10; // Default maximum number of rows for the textarea
    const placeholder = passedPlaceholder || i18next.t("Search");
    
    const [textAreaMaxRows, setTextAreaMaxRows] = useState(1);

    const onSearch = () => {
      updateQueryState({ ...currentQueryState, queryString, page: 1 });
    };
    const onBtnSearchClick = () => {
      onSearch();
    };
    const onKeyPress = (event) => {
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

    const handleFocus = () => {
      setTextAreaMaxRows(initialMaxRows); // Expand to multiple lines when focused
    };

    const handleBlur = () => {
      setTextAreaMaxRows(1); // Reset to single line when blurred
    };

    return (
      <div className="ui fluid action icon input">
        <TextareaAutosize
          className="ui multiline-textarea"
          placeholder={placeholder}
          aria-label={placeholder}
          value={queryString}
          onChange={handleInputChange}
          onKeyPress={onKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          minRows="1"
          maxRows={textAreaMaxRows}
        />
        {queryString && (
          <Icon
            name="close"
            role="button"
            className="clear-button"
            link
            onClick={handleClear}
            aria-label={i18next.t("Clear")}
          />
        )}
        <Button
          type="submit"
          icon
          className="search"
          color={iconColor}
          onClick={onBtnSearchClick}
          aria-label={i18next.t("Search")}
          {...actionProps}
        >
          <Icon name={iconName} />
        </Button>
      </div>
    );
  }
);

SearchappSearchbarElement.propTypes = {
  placeholder: PropTypes.string,
  queryString: PropTypes.string,
  onInputChange: PropTypes.func,
  updateQueryState: PropTypes.func,
  currentQueryState: PropTypes.object,
  iconName: PropTypes.string,
  iconColor: PropTypes.string,
};

SearchappSearchbarElement.defaultProps = {
  placeholder: i18next.t("Search"),
  iconName: "search",
};
