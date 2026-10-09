// SPDX-FileCopyrightText: 2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

// object that can be used to override components marked as Overridable
// can be placed inside of /templates/overridableRegistry in any library or in
// the app itself. In case of using it, your mapping.js file must also import React
const mapping = {
  // [`${appName}.EmptyResults.element`]: <MyEmptyResultsElement />
};

export default mapping;
