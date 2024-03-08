import _padStart from "lodash/padStart";
import { i18next } from "@translations/oarepo_ui/i18next";
import { parse } from "edtf";
import _trim from "lodash/trim";

export const edtfDateFormatOptions = [
  { value: "yyyy", text: i18next.t("Year") },
  { value: "yyyy-mm", text: i18next.t("Year and month") },
  { value: "yyyy-mm-dd", text: i18next.t("Year, month and date") },
];

export const allEmptyStrings = (arr) => arr.every((element) => element === "");

export const serializeDate = (dateObj, dateEdtfFormat) => {
  if (dateObj === null) return "";

  if (dateEdtfFormat === "yyyy") return dateObj.getFullYear();
  if (dateEdtfFormat === "yyyy-mm")
    return `${dateObj.getFullYear()}-${_padStart(
      dateObj.getMonth() + 1,
      2,
      "0"
    )}`;
  if (dateEdtfFormat === "yyyy-mm-dd")
    return `${dateObj.getFullYear()}-${_padStart(
      dateObj.getMonth() + 1,
      2,
      "0"
    )}-${_padStart(dateObj.getDate(), 2, "0")}`;
};

export const deserializeDate = (edtfDateString) => {
  if (edtfDateString) {
    try {
      const dateObject = new Date(edtfDateString);
      // Check if the dateObject is valid
      if (isNaN(dateObject.getTime())) {
        throw new Error("Invalid date string");
      }
      return dateObject;
    } catch (error) {
      return null;
    }
  } else {
    return null;
  }
};

export const getDateFormatStringFromEdtfFormat = (dateEdtfFormat) => {
  if (dateEdtfFormat === "yyyy-mm-dd") return "PPP";
  if (dateEdtfFormat === "yyyy-mm") return "MMMM yyyy";
  if (dateEdtfFormat === "yyyy") return "yyyy";
};

export const getInitialEdtfDateFormat = (fieldValue) => {
  let dateEdtfFormat;
  if (fieldValue) {
    const value = fieldValue.includes("/")
      ? fieldValue.split("/")[0] || fieldValue.split("/")[1]
      : fieldValue;
    if (parse(_trim(value)).values.length === 1) {
      dateEdtfFormat = "yyyy";
    } else if (parse(_trim(value)).values.length === 2) {
      dateEdtfFormat = "yyyy-mm";
    } else {
      dateEdtfFormat = "yyyy-mm-dd";
    }
  } else {
    dateEdtfFormat = "yyyy-mm-dd";
  }
  return dateEdtfFormat;
};

const getInitialDatePickerSelectionType = (dates) => {
  if (dates[0] && dates[1] && dates[0].getTime() === dates[1].getTime()) {
    return true;
  } else {
    return false;
  }
};
