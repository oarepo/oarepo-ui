import {
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";

export const getAddFunc = (interval) => {
  if (interval.includes("y")) {
    return addYears;
  }
  if (interval.includes("M")) {
    return addMonths;
  }

  return addDays;
};

export const getDiffFunc = (interval) => {
  if (interval.includes("y")) {
    return differenceInYears;
  }
  if (interval.includes("M")) {
    return differenceInMonths;
  }

  return differenceInDays;
};

export const getFormatString = (interval) => {
  if (interval.includes("y")) {
    return "yyyy";
  }
  if (interval.includes("M")) {
    return "MMMM yyyy";
  }

  return "PPP";
};
