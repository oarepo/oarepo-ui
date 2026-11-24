// SPDX-FileCopyrightText: 2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import $ from "jquery";

$(document).on("click", ".show-more .show-more-button", function () {
  const $button = $(this);
  const $root = $button.closest(".show-more");
  const expanded = $button.attr("aria-expanded") === "true";

  $root.find(".show-more-rest").prop("hidden", expanded);
  $root.find(".show-more-ellipsis").prop("hidden", !expanded);
  $button
    .attr("aria-expanded", String(!expanded))
    .text($button.attr(expanded ? "data-open-text" : "data-close-text"));
});
