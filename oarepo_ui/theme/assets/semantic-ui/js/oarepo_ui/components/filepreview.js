import $ from "jquery";

const iframe = document.querySelector(".fileIframe");

$("#preview-modal").modal({
  onShow: function () {
    const contentHeight = window.innerHeight * 0.8;
    iframe.style.height = `${contentHeight - 60}px`;
  },
});

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
