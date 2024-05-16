import $ from "jquery";

$("#preview-modal").modal();
const iframe = document.querySelector(".fileIframe");

function openModal(event) {
  const fileTitle = event.target.dataset.title;
  iframe.src = window.location.href + "/files/" + fileTitle + "/preview";
  $("#preview-modal").modal("show");
}

document.querySelectorAll(".openPreviewIcon").forEach(function (icon) {
  icon.addEventListener("click", openModal);
});

$("#preview-modal .close").click(function () {
  $("#preview-modal").modal("hide");
});
