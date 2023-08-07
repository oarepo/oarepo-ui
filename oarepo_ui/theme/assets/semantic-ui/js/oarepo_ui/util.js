import { i18next } from "@translations/oarepo_ui/i18next";
import _findKey from "lodash/findKey";

export const getInputFromDOM = (elementName) => {
  const element = document.getElementsByName(elementName);
  if (element.length > 0 && element[0].hasAttribute("value")) {
    return JSON.parse(element[0].value);
  }
  return null;
};

export const scrollTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "smooth",
  });
};

// function to display some meaningfull text in case the selected or default language both don't have textual value
export const languageFallback = (titleObject) => {
  return (
    titleObject[i18next.language] ||
    titleObject[i18next.options.fallbackLng] ||
    titleObject[_findKey(titleObject, (value) => Boolean(value))]
  );
};
