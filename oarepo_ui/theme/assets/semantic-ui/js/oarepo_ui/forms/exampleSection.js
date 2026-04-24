import React from "react";
import { i18next } from "@translations/oarepo_ui/i18next";

export const ExampleSection = {
  key: "general-information",
  label: i18next.t("General information"),
  component: () => {
    return (
      <p>
        {i18next.t("Please define your sections.")}{" "}
        <a
          href="https://nrp-cz.github.io/docs/customize/model_ui/deposit#defining-sections"
          target="_blank"
          rel="noopener noreferrer"
        >
          {i18next.t("See the documentation")}
        </a>
      </p>
    );
  },
  includesPaths: [],
};
