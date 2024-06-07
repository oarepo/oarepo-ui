import $ from "jquery";

const iframe = document.querySelector("#preview-modal .content");

function openModal(event) {
  const previewLink = event.target.getAttribute("data-preview-link");
  if (previewLink) {
    iframe.src = previewLink;
    $("#preview-modal").modal("show");
  }
}

document.querySelectorAll(".openPreviewIcon").forEach(function (icon) {
  icon.addEventListener("click", openModal);
});

$("#preview-modal .close").click(function () {
  $("#preview-modal").modal("hide");
});
