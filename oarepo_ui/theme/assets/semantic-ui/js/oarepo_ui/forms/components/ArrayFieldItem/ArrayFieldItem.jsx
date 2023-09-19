import React, { useState } from "react";
import { GroupField } from "react-invenio-forms";
import { Form, Button, Icon } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";

// TODO: decide what to do about the button and margin
export const ArrayFieldItem = ({
  arrayHelpers,
  indexPath,
  children,
  className,
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
        <Button
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
      </Form.Field>
    </GroupField>
  );
};

ArrayFieldItem.propTypes = {
  arrayHelpers: PropTypes.object,
  indexPath: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

ArrayFieldItem.defaultProps = {
  className: "invenio-group-field",
};
