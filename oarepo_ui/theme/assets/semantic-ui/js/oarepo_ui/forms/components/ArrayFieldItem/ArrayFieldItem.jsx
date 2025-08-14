import React, { useState } from "react";
import { GroupField, FieldLabel } from "react-invenio-forms";
import { Form, Button, Icon } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";

export const ArrayFieldItem = ({
  arrayHelpers,
  indexPath,
  children = null,
  className = "invenio-group-field",
  removeButton: RemoveButton,
  displayFirstInputRemoveButton = true,
  removeButtonProps,
  removeButtonLabelClassName = "",
  fieldPathPrefix,
  ...uiProps
}) => {
  const [highlighted, setHighlighted] = useState(false);
  const removeButtonId = `${fieldPathPrefix}.remove-button`;
  if (!displayFirstInputRemoveButton && indexPath === 0) {
    return (
      <GroupField
        className={`${highlighted ? "highlighted" : ""} ${className}`}
        {...uiProps}
      >
        {children}
      </GroupField>
    );
  }
  return (
    <GroupField
      className={`${highlighted ? "highlighted" : ""} ${className}`}
      {...uiProps}
    >
      {children}
      <Form.Field>
        <FieldLabel
          label={i18next.t("Remove")}
          htmlFor={removeButtonId}
          className={
            removeButtonLabelClassName
              ? `visually-hidden ${removeButtonLabelClassName}`
              : "visually-hidden"
          }
        />
        {RemoveButton ? (
          <RemoveButton
            arrayHelpers={arrayHelpers}
            indexPath={indexPath}
            id={removeButtonId}
            onMouseEnter={() => setHighlighted(true)}
            onMouseLeave={() => setHighlighted(false)}
            {...removeButtonProps}
          />
        ) : (
          <Button
            aria-label={i18next.t("Remove field")}
            className="close-btn"
            type="button"
            icon
            id={removeButtonId}
            onClick={() => {
              arrayHelpers.remove(indexPath);
            }}
            onMouseEnter={() => setHighlighted(true)}
            onMouseLeave={() => setHighlighted(false)}
          >
            <Icon name="close" />
          </Button>
        )}
      </Form.Field>
    </GroupField>
  );
};

ArrayFieldItem.propTypes = {
  arrayHelpers: PropTypes.object.isRequired,
  indexPath: PropTypes.number.isRequired,
  /* eslint-disable react/require-default-props */
  children: PropTypes.node,
  className: PropTypes.string,
  removeButton: PropTypes.func,
  removeButtonProps: PropTypes.object,
  displayFirstInputRemoveButton: PropTypes.bool,
  removeButtonLabelClassName: PropTypes.string,
  fieldPathPrefix: PropTypes.string.isRequired,
  /* eslint-enable react/require-default-props */
};
