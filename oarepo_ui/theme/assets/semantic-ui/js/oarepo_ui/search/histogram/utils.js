import {
  addDays,
  addYears,
  subYears,
  subDays,
  differenceInDays,
  differenceInYears,
} from "date-fns";

export const getAddFunc = (interval = "year") => {
  if (interval === "day") {
    return addDays;
  } else {
    return addYears;
  }
};

export const getOpacityClass = (opacity) => {
  if (opacity <= 0.25) return "opacity-25";
  if (opacity <= 0.5) return "opacity-50";
  if (opacity <= 0.75) return "opacity-75";
  return "opacity-100";
};

export const getSubtractFunc = (interval = "year") => {
  if (interval === "day") {
    return subDays;
  } else {
    return subYears;
  }
};

export const getDiffFunc = (interval = "year") => {
  if (interval === "day") {
    return differenceInDays;
  } else {
    return differenceInYears;
  }
};

export const getFormatString = (interval = "year") => {
  if (interval === "day") {
    return "PPP";
  } else {
    return "yyyy";
  }
};

export const calculateZoomIn = (
  sliderMin,
  sliderMax,
  min,
  max,
  coefficient = 0.1
) => {
  const newMin =
    sliderMin + Math.floor(max * coefficient) <= max
      ? sliderMin + Math.floor(max * coefficient)
      : max;
  const newMax =
    sliderMax - Math.floor(max * coefficient) >= min
      ? sliderMax - Math.floor(max * coefficient)
      : min;
  return [newMin, newMax];
};

export const calculateZoomOut = (
  sliderMin,
  sliderMax,
  min,
  max,
  coefficient = 0.1
) => {
  const newMin =
    sliderMin - Math.floor(max * coefficient) >= min
      ? sliderMin - Math.floor(max * coefficient)
      : min;
  const newMax =
    sliderMax + Math.floor(max * coefficient) <= max
      ? sliderMax + Math.floor(max * coefficient)
      : max;
  return [newMin, newMax];
};
