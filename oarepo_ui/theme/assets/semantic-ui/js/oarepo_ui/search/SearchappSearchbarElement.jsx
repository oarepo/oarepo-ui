// no multiple options search bar

import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { withState } from "react-searchkit";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Button, Icon } from "semantic-ui-react";

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
    const placeholder = passedPlaceholder || i18next.t("Search");
    const textareaRef = useRef(null);

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

    const autoResize = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(38, textarea.scrollHeight) + 'px';
      }
    };

    useEffect(() => {
      autoResize();
    }, [queryString]);

    const handleInputChange = (event) => {
      onInputChange(event.target.value);
      autoResize();
    };

    const handleClear = () => {
      onInputChange("");
      if (textareaRef.current) {
        textareaRef.current.style.height = '38px';
        textareaRef.current.focus();
      }
    };

    return (
      <div className="ui fluid action input" style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          className="form-control searchbar-textarea"
          placeholder={placeholder}
          aria-label={placeholder}
          value={queryString}
          onChange={handleInputChange}
          onKeyPress={onKeyPress}
          style={{
            resize: 'none',
            minHeight: '38px',
            overflowY: 'hidden',
            paddingRight: queryString ? '70px' : '42px',
            border: '1px solid rgba(34,36,38,.15)',
            borderRadius: '.28571429rem 0 0 .28571429rem',
            fontFamily: 'inherit',
            fontSize: '1em',
            padding: '0.67857143em 1em',
            width: '100%',
            boxSizing: 'border-box',
            outline: 'none',
            zIndex: 10,
          }}
          rows="1"
        />
        {queryString && (
          <Icon
            name="close"
            role="button"
            className="searchbar-clear-button"
            link
            onClick={handleClear}
            aria-label={i18next.t("Clear")}
            style={{
              position: 'absolute',
              right: '3em',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              padding: '4px',
              zIndex: 100,
              minHeight: 'auto',
              height: 'auto'
            }}
          >
          </Icon>
        )}
        <Button
          type="submit"
          icon
          className="search"
          color={iconColor}
          onClick={onBtnSearchClick}
          aria-label={i18next.t("Search")}
          style={{
            borderRadius: '0 .28571429rem .28571429rem 0'
          }}
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
