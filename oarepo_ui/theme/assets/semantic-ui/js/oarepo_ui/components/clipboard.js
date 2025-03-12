import $ from "jquery";

function copyToClipboard(buttonElement) {
  const $buttonElement = $(buttonElement);
  const $icon = $buttonElement.find("i.icon");

  if (!$buttonElement.transition("is animating")) {
    $buttonElement.transition("save conditions", { silent: true });

    buttonElement.setAttribute("aria-label", "Copying...");

    $icon.removeClass("outline copy");
    $icon.addClass("notched circle loading");
    const text = buttonElement.dataset?.clipboardText ?? "";
    navigator.clipboard
      .writeText(text)
      .then(() => {
        $icon.removeClass("notched circle loading");
        $icon.addClass("check");
        buttonElement.setAttribute("aria-label", "Copied!");
        $buttonElement.transition({
          animation: "fade",
          duration: "1s",
          onComplete: function () {
            $buttonElement.transition("restore conditions");
            $icon.removeClass("check");
            $icon.addClass("outline copy");

            buttonElement.setAttribute(
              "aria-label",
              buttonElement.dataset.originalAriaLabel
            );
          },
        });
      })
      .catch((err) => {
        $icon.removeClass("notched circle loading");
        $icon.addClass("exclamation triangle");

        buttonElement.setAttribute("aria-label", "Copy failed!");

        $buttonElement.transition({
          animation: "fade",
          duration: "1s",
          onComplete: function () {
            $buttonElement.transition("restore conditions");
            $icon.removeClass("exclamation triangle");
            $icon.addClass("outline copy");

            buttonElement.setAttribute(
              "aria-label",
              buttonElement.dataset.originalAriaLabel
            );
          },
        });
      });
  }
}
function configureCopyButtons(copyButtons) {
  copyButtons.each((index, element) => {
    $(element).on("click", () => {
      copyToClipboard(element);
    });
  });
}

export function deinitializeCopyButtons(copyButtons) {
  copyButtons = copyButtons?.jquery ? copyButtons : $(copyButtons);
  copyButtons.each((index, element) => {
    const $element = $(element);
    $element.off("click");
  });
}

export function initCopyButtons(copyButtons) {
  copyButtons = copyButtons?.jquery ? copyButtons : $(copyButtons);
  // Firefox 1.0+
  const isFirefox = typeof InstallTrigger !== "undefined";
  if (!isFirefox) {
    navigator.permissions
      .query({ name: "clipboard-write" })
      .then((result) => {
        if (result.state === "granted" || result.state === "prompt") {
          configureCopyButtons(copyButtons);
        } else {
          copyButtons.each((index, element) => {
            $(element).addClass("disabled");
          });
        }
      })
      .catch((err) => {
        copyButtons.each((index, element) => {
          $(element).remove(); // Remove the button
        });
      });
  } else {
    // Firefox does not support "clipboard-write" permission
    configureCopyButtons(copyButtons);
  }
}

// Initialize clipboard copy buttons
const copyButtons = $(".copy-button");
initCopyButtons(copyButtons);
