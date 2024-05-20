import Clipboard from "clipboard";
import $ from "jquery";
import { i18next } from "@translations/oarepo_ui/i18next";

const setTooltip = (message, element) => {
  element.attr("data-tooltip", message);
};

const hideTooltip = (element) => {
  setTimeout(() => {
    element.removeAttr("data-tooltip");
  }, 2000);
};

const clipboard = new Clipboard(".copy-btn");

clipboard.on("success", (e) => {
  $(".copy-btn").css("opacity", 0.3);
  const target = $(e.trigger);
  setTooltip(i18next.t("Copied!"), target);
  hideTooltip(target);
  target.css("opacity", 1);
});

clipboard.on("error", (e) => {
  $(".copy-btn").css("opacity", 0.3);
  const target = $(e.trigger);
  setTooltip(i18next.t("Failed!"), target);
  hideTooltip(target);
});

$(".copy-btn").on("mouseleave", function () {
  $(this).removeAttr("data-tooltip");
});
