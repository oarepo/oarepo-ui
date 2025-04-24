import React from "react";
import ReactDOM from "react-dom";
import { ShareButton } from "@js/invenio_app_rdm/landing_page/ShareOptions/ShareButton";

const recordSharingDiv = document.getElementById("recordSharing");
if (recordSharingDiv) {
  const record = JSON.parse(recordSharingDiv.dataset.record);
  const permissions = JSON.parse(recordSharingDiv.dataset.permissions);
  const groupsEnabled = JSON.parse(recordSharingDiv.dataset.groupsEnabled);
  
  ReactDOM.render(
    <ShareButton
      record={record}
      // TODO: add proper permission for making the button disabled
      disabled={false}
      permissions={permissions}
      groupsEnabled={groupsEnabled}
    />,
    recordSharingDiv
  );
}
