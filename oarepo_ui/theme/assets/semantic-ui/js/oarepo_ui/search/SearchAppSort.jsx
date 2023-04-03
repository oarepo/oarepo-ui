import React from "react";
import { Sort } from "react-searchkit";

import { i18next } from "@translations/oarepo_ui/i18next";

export const SearchAppSort = ({ options }) => {
  return (
    <Sort
      sortOrderDisabled
      values={options}
      ariaLabel={i18next.t("Sort")}
      label={(cmp) => (
        <>
          <label className="mr-10">{i18next.t("Sort by")}</label>
          {cmp}
        </>
      )}
    />
  );
};
