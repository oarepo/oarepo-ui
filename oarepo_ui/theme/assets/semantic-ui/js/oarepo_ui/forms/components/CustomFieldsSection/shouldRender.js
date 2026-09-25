// This file is part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
// Copyright (C) 2026 CESNET z.s.p.o.
//
// oarepo-ui is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

export const CUSTOM_FIELDS_SECTION_KEY = "custom-fields";

/**
 * @param {Array|undefined|null} sections wizard sections passed to DepositFormApp
 * @param {object|undefined|null} config form config (contains custom_fields)
 * @returns {boolean}
 */
export const shouldRenderCustomFieldsSection = (sections, config) => {
  const configured = (config?.custom_fields?.ui ?? []).length > 0;
  const alreadyPresent = (sections ?? []).some(
    (section) => section?.key === CUSTOM_FIELDS_SECTION_KEY
  );
  return configured && !alreadyPresent;
};
