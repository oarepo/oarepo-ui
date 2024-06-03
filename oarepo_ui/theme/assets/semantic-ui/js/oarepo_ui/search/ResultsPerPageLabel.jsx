import React from "react";
import { i18next } from "@translations/oarepo_ui/i18next";

export const ResultsPerPageLabel = (cmp) => (
  <div data-testid="pages-component">
    {cmp} {i18next.t("resultsPerPage")}
  </div>
);
