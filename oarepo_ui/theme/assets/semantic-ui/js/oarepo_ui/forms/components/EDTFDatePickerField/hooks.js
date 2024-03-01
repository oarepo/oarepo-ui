import { useState, useEffect } from "react";
import { registerLocale } from "react-datepicker";
import { parse } from "edtf";
import _trim from "lodash/trim";

export const useInitialDateEdtfFormat = (fieldValue) => {
  let dateEdtfFormat;
  if (fieldValue) {
    const value = fieldValue.includes("/")
      ? fieldValue.split("/")[0]
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

  const [initialDateEdtfFormat, setInitialDateEdtfFormat] =
    useState(dateEdtfFormat);
  return [initialDateEdtfFormat, setInitialDateEdtfFormat];
};

export const useLoadLocaleObjects = (localesArray = ["cs", "en-US"]) => {
  const [componentRendered, setComponentRendered] = useState(false);

  useEffect(() => {
    const importLocaleFile = async () => {
      for (const locale of localesArray) {
        const dynamicLocale = await import(
          `date-fns/locale/${locale}/index.js`
        );
        registerLocale(locale, dynamicLocale.default);
      }
      setComponentRendered(true);
    };

    if (!componentRendered) {
      importLocaleFile();
    }
  }, [componentRendered, localesArray]);
};
