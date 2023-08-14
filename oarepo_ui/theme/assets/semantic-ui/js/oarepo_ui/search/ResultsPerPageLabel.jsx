import React from "react";
import { i18next } from "@translations/oarepo_ui/i18next";

export const ResultsPerPageLabel = (cmp) => (
  <>
    {cmp} {i18next.t("resultsPerPage")}
  </>
);
