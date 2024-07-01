import $ from "jquery";
import { i18next } from "@translations/oarepo_ui/i18next";

const setTooltip = (message, element) => {
  element.attr("data-tooltip", message);
};

const hideTooltip = (element) => {
  setTimeout(() => {
    element.removeClass("selected").removeAttr("data-tooltip");
  }, 2000);
};

const copyTextToClipboard = async (text, trigger) => {
  try {
    await navigator.clipboard.writeText(text);
    $(".copy-btn").removeClass("selected");
    const target = $(trigger);
    setTooltip(i18next.t("Copied!"), target);
    hideTooltip(target);
    target.addClass("selected");
  } catch (err) {
    $(".copy-btn").css("opacity", 0.3);
    const target = $(trigger);
    setTooltip(i18next.t("Copy to clipboard failed!"), target);
    hideTooltip(target);
    target.css("opacity", 1);
  }
};

$(".copy-btn").on("click", function () {
  const textToCopy = $(this).data("clipboard-text");
  if (textToCopy) {
    copyTextToClipboard(textToCopy, this);
  }
});

$(".copy-btn").on("mouseleave", function () {
  $(this).removeAttr("data-tooltip");
});
