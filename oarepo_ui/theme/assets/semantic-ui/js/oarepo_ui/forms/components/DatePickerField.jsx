import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// import "/home/dusanst/Projects/nr-docs-repo/nr-docs/node_modules/react-datepicker/dist/react-datepicker.css";

export const DatepickerField = () => {
  const [startDate, setStartDate] = useState(new Date());
  return (
    <DatePicker
      selected={startDate}
      onChange={(date) => setStartDate(date)}
      showYearPicker
      dateFormat="yyyy"
    />
  );
};
