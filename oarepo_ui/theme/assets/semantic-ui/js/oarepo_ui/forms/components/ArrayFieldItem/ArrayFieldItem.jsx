import React, { useState } from "react";
import { GroupField, FieldLabel } from "react-invenio-forms";
import { Form, Button, Icon } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";

export const ArrayFieldItem = ({
  arrayHelpers,
  indexPath,
  children,
  className,
  removeButton: RemoveButton,
  displayRemoveButton,
  removeButtonProps,
  removeButtonLabelClassName,
  ...uiProps
}) => {
  const [highlighted, setHighlighted] = useState(false);

  if (!displayRemoveButton) {
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
          htmlFor={indexPath}
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
            {...removeButtonProps}
          />
        ) : (
          <Button
            aria-label={i18next.t("Remove field")}
            className="close-btn"
            type="button"
            icon
            id={indexPath}
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
  arrayHelpers: PropTypes.object,
  indexPath: PropTypes.number,
  children: PropTypes.node,
  className: PropTypes.string,
  removeButton: PropTypes.node,
  removeButtonProps: PropTypes.object,
  displayRemoveButton: PropTypes.bool,
  removeButtonLabelClassName: PropTypes.string,
};

ArrayFieldItem.defaultProps = {
  className: "invenio-group-field",
  removeButton: undefined,
  removeButtonProps: {},
  displayRemoveButton: true,
};
