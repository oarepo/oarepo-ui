import $ from "jquery";

$("#preview-modal").modal();
const iframe = document.querySelector(".fileIframe");

function openModal(event) {
  iframe.src = event.target.dataset.link;
  $("#preview-modal").modal("show");
}

document.querySelectorAll(".openPreviewIcon").forEach(function (icon) {
  icon.addEventListener("click", openModal);
});

$("#preview-modal .close").click(function () {
  $("#preview-modal").modal("hide");
});
