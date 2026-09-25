// This file is part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
// Copyright (C) 2026 CESNET z.s.p.o.
//
// oarepo-ui is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import React from "react";
import PropTypes from "prop-types";
import { CustomFields } from "react-invenio-forms";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useFormConfig } from "../../hooks";
import { CUSTOM_FIELDS_SECTION_KEY } from "./shouldRender";

const TEMPLATE_LOADERS = [
  (widget) => import(`@templates/custom_fields/${widget}.js`),
  (widget) => import(`@js/invenio_rdm_records/src/deposit/customFields`),
  (widget) => import(`react-invenio-forms`),
];

const CustomFieldsSectionContent = ({ record }) => {
  const formConfig = useFormConfig();
  const customFieldsUI = formConfig.custom_fields?.ui ?? [];
  return (
    <CustomFields
      config={customFieldsUI}
      record={record}
      fieldPathPrefix="custom_fields"
      templateLoaders={TEMPLATE_LOADERS}
    />
  );
};

CustomFieldsSectionContent.propTypes = {
  record: PropTypes.object,
};

export const CustomFieldsSection = {
  key: CUSTOM_FIELDS_SECTION_KEY,
  label: i18next.t("Additional fields"),
  component: CustomFieldsSectionContent,
  includesPaths: ["custom_fields"],
};
