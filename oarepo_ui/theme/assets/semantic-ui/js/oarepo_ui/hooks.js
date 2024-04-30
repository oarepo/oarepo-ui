import { useState, useEffect } from "react";
import { registerLocale } from "react-datepicker";

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
