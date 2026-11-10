// SPDX-FileCopyrightText: 2023-2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import $ from "jquery";

$(".ui.multilingual-tabs>.menu>.item").tab();
// Accordions using the ".trigger" convention are initialized by invenio_theme (with open/close text handlers);
// re-initializing them here would wipe those settings.
$(".ui.accordion")
  .filter((_, el) => !$(el).find(".trigger").length)
  .accordion();
