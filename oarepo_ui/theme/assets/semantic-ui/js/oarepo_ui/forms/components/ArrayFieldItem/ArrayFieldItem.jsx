import React, { useState } from "react";
import { GroupField } from "react-invenio-forms";
import { Form, Button, Icon } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";

export const ArrayFieldItem = ({
  arrayHelpers,
  indexPath,
  children,
  className,
  removeButton: RemoveButton,
  removeButtonProps,
  ...uiProps
}) => {
  const [highlighted, setHighlighted] = useState(false);
  return (
    <GroupField
      className={`${highlighted ? "highlighted" : ""} ${className}`}
      {...uiProps}
    >
      {children}
      <Form.Field>
        {RemoveButton ? (
          <RemoveButton
            arrayHelpers={arrayHelpers}
            indexPath={indexPath}
            {...removeButtonProps}
          />
        ) : (
          <Button
            style={{ marginTop: "1.75rem" }}
            aria-label={i18next.t("Remove field")}
            className="close-btn"
            icon
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
};

ArrayFieldItem.defaultProps = {
  className: "invenio-group-field",
  removeButton: undefined,
  removeButtonProps: {},
};
