// no multiple options search bar

import React from "react";
import PropTypes from "prop-types";
import { withState } from "react-searchkit";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Input } from "semantic-ui-react";

export const SearchappSearchbarElement = withState(
  ({
    queryString,
    onInputChange,
    updateQueryState,
    currentQueryState,
    iconName,
    iconColor,
    placeholderText,
  }) => {
    const onSearch = () => {
      updateQueryState({ ...currentQueryState, queryString });
    };
    const onBtnSearchClick = () => {
      onSearch();
    };
    const onKeyPress = (event) => {
      if (event.key === "Enter") {
        onSearch();
      }
    };
    return (
      <Input
        action={{
          icon: iconName,
          color: iconColor,
          onClick: onBtnSearchClick,
          "aria-label": i18next.t("Search"),
        }}
        fluid
        placeholder={placeholderText}
        aria-label={placeholderText}
        onChange={(event, { value }) => {
          onInputChange(value);
        }}
        value={queryString}
        onKeyPress={onKeyPress}
      />
    );
  }
);

SearchappSearchbarElement.propTypes = {
  placeholderText: PropTypes.string,
  queryString: PropTypes.string,
  onInputChange: PropTypes.func,
  updateQueryState: PropTypes.func,
  currentQueryState: PropTypes.object,
  iconName: PropTypes.string,
  iconColor: PropTypes.string,
};

SearchappSearchbarElement.defaultProps = {
  placeholderText: i18next.t("Search"),
  iconName: "search",
  iconColor: "green",
};
