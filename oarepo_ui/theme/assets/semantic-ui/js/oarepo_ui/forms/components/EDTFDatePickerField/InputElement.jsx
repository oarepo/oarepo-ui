import React from "react";
import { Form, Icon } from "semantic-ui-react";

export const InputElement = ({
  startDate,
  clearButtonClassName,
  dates,
  ...restProps
}) => (
  <Form.Input
    value={startDate}
    icon={
      startDate ? (
        <Icon
          className={clearButtonClassName}
          name="close"
          onClick={() => {
            dates[0] = null;
            handleChange(dates);
          }}
        />
      ) : null
    }
  />
);
