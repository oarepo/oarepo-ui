// SPDX-FileCopyrightText: 2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import React from "react";
import { i18next } from "@translations/oarepo_ui/i18next";

export const ResultsPerPageLabel = (cmp) => (
  <>
    {i18next.t("resultsPerPage")} {cmp}
  </>
);
