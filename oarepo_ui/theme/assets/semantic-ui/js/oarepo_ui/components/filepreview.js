import $ from "jquery";

const iframe = document.querySelector("#preview-modal .content");

function openModal(event) {
  const previewLink = event.target.getAttribute("data-preview-link");
  const fileName = event.target.getAttribute("data-preview-file-name");
  if (previewLink) {
    iframe.src = previewLink;
    $("#preview-modal").modal("show");
    const filePreviewHeader = document.getElementById("preview-file-title");
    if (filePreviewHeader) {
      filePreviewHeader.textContent = fileName;
    }
  }
}

document.querySelectorAll(".openPreviewIcon").forEach(function (icon) {
  icon.addEventListener("click", openModal);
});

$("#preview-modal .close").click(function () {
  $("#preview-modal").modal("hide");
});
