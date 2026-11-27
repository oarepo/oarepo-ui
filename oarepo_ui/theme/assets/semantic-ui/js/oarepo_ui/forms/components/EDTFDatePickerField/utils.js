// SPDX-FileCopyrightText: 2024-2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import _padStart from "lodash/padStart";
import { i18next } from "@translations/oarepo_ui/i18next";
import { setMonth } from "date-fns";

export const edtfDateFormatOptions = [
  { value: "yyyy", text: i18next.t("Year") },
  { value: "yyyy-mm", text: i18next.t("Year and month") },
  { value: "yyyy-mm-dd", text: i18next.t("Year, month and date") },
];

const getPaddedYearString = (dateObj) => {
  const year = dateObj.getFullYear();
  return _padStart(`${year}`, 4, "0");
};
export const allEmptyStrings = (arr) => arr.every((element) => element === "");

export const serializeDate = (dateObj, dateEdtfFormat) => {
  if (dateObj === null) return "";

  if (dateEdtfFormat === "yyyy") return getPaddedYearString(dateObj);
  if (dateEdtfFormat === "yyyy-mm")
    return `${getPaddedYearString(dateObj)}-${_padStart(
      dateObj.getMonth() + 1,
      2,
      "0"
    )}`;
  if (dateEdtfFormat === "yyyy-mm-dd")
    return `${getPaddedYearString(dateObj)}-${_padStart(
      dateObj.getMonth() + 1,
      2,
      "0"
    )}-${_padStart(dateObj.getDate(), 2, "0")}`;
};

const EDTF_DATE_RE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

// strict, unlike new Date(): partial text and impossible dates (2023-02-29) give null
export const deserializeDate = (edtfDateString) => {
  const match = EDTF_DATE_RE.exec(edtfDateString || "");
  // year 0 gets past the backend, but the draft's form page then fails to load
  if (!match || match[1] === "0000") return null;
  const month = Number(match[2] || 1);
  const day = Number(match[3] || 1);
  const date = new Date(2000, 0, 1);
  // setFullYear keeps years 0-99 literal
  date.setFullYear(Number(match[1]), month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

export const getDateFormatStringFromEdtfFormat = (dateEdtfFormat) => {
  if (dateEdtfFormat === "yyyy-mm-dd") return "PPP";
  if (dateEdtfFormat === "yyyy-mm") return "MMMM yyyy";
  if (dateEdtfFormat === "yyyy") return "yyyy";
};

// precision of the first date in the value, or the fallback while it isn't a date yet
export const getInitialEdtfDateFormat = (
  fieldValue,
  fallback = "yyyy-mm-dd"
) => {
  const [start, end] = (fieldValue || "").split("/");
  const match = EDTF_DATE_RE.exec(start || end || "");
  if (!match) return fallback;
  if (match[3]) return "yyyy-mm-dd";
  return match[2] ? "yyyy-mm" : "yyyy";
};

export function getMonthInLocale(month, locale) {
  return setMonth(new Date(), month).toLocaleString(locale, { month: "long" });
}

const maskDate = (raw, typingAtEnd) => {
  let digits = raw.replace(/\D/g, "").slice(0, 8);
  // a month or day digit that can't start a two-digit one, or has a dash typed after it,
  // gets a leading zero: 20244 -> 2024-04, 2024-1- -> 2024-01-.
  // Only at the end of the text: inside it, the half-edited states would reflow the date.
  const pads = (digit, max) =>
    typingAtEnd && (digit > max || raw.endsWith("-"));
  if (digits.length === 5 && pads(digits[4], "1"))
    digits = `${digits.slice(0, 4)}0${digits[4]}`;
  if (digits.length === 7 && pads(digits[6], "3"))
    digits = `${digits.slice(0, 6)}0${digits[6]}`;
  let masked = digits.slice(0, 4);
  if (digits.length > 4) masked += `-${digits.slice(4, 6)}`;
  if (digits.length > 6) masked += `-${digits.slice(6, 8)}`;
  if (raw.endsWith("-") && (digits.length === 4 || digits.length === 6))
    masked += "-";
  return masked;
};

// Digits get their dashes as you type; a "/" splits the start and the end. A single-date
// field keeps the "/" too and getEdtfDateError flags it: dropping it would merge the digits
// around it into another valid date.
// Returns the caret position too, so editing mid-value doesn't throw it to the end.
export const maskEdtfInput = (raw, caret, overwrite = false) => {
  // typing inside a complete date replaces the next digit instead of pushing the last one out
  const part = raw.split("/")[raw.slice(0, caret).split("/").length - 1];
  if (overwrite && (part.match(/\d/g) || []).length > 8)
    raw = raw.slice(0, caret) + raw.slice(caret).replace(/^(-*)\d/, "$1");
  const atEnd = caret >= raw.length;
  const chars = raw.replace(/[^\d/-]/g, "");
  const slash = chars.indexOf("/");
  const value =
    slash === -1
      ? maskDate(chars, atEnd)
      : `${maskDate(chars.slice(0, slash), false)}/${maskDate(
          chars.slice(slash + 1),
          atEnd
        )}`;
  if (atEnd) return { value, caret: value.length };
  const before = (raw.slice(0, caret).match(/[\d/]/g) || []).length;
  let position = 0;
  for (let seen = 0; position < value.length && seen < before; position++) {
    if (/[\d/]/.test(value[position])) seen++;
  }
  return { value, caret: position };
};

// why the value isn't a date (or a date range) yet; null when it's fine or empty
export const getEdtfDateError = (value, isRange, allowRange = true) => {
  if (!value) return null;
  const parts = value.split("/");
  if (!allowRange && parts.length > 1)
    return i18next.t("This field takes a single date, not a range.");
  if ((isRange && parts.length === 1) || parts.some((part) => !part))
    return i18next.t(
      "Fill in both the start and the end of the range, or switch to Single."
    );
  if (parts.some((part) => !EDTF_DATE_RE.test(part)))
    return isRange
      ? i18next.t(
          "Use the format YYYY, YYYY-MM or YYYY-MM-DD for both the start and the end, separated by a slash."
        )
      : i18next.t("Use the format YYYY, YYYY-MM or YYYY-MM-DD.");
  if (parts.some((part) => !deserializeDate(part)))
    return i18next.t("This date doesn't exist.");
  // same-width ISO parts sort by their first day; a start inside the end's year or month is still fine
  const [start, end] = parts;
  if (end && start > end && !start.startsWith(end))
    return i18next.t("The start of the range can't be after its end.");
  return null;
};
