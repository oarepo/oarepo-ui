import React from "react";
import PropTypes from "prop-types";

import { ShareButton } from "@js/invenio_app_rdm/landing_page/ShareOptions/ShareButton";
import { RecordRequests } from "@js/oarepo_requests";
import {
  handleRedirectToEditFormPlugin,
  cfValidationErrorPlugin,
} from "@js/oarepo_requests_common";

import { Header, Button, Icon } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";

export const RecordActionButtons = ({ record, permissions, groupsEnabled }) => {
  const recordRequestsExist = record.expanded.requests?.filter(request => ['submitted', 'created'].includes(request.status_code));

  return (
    <>
      <Header as="h2" size="small" className="detail-sidebar-header">
        {i18next.t("Actions")}
        <a href={record.links.requests_html} target="_blank" rel="noopener noreferrer" title={i18next.t("Search record's requests")}>
          <Icon name="eye" color="black" />
        </a>
      </Header>
      {record.links.edit_html &&
        <div className="mb-10">
          <a href={record.links.edit_html}>
            <Button labelPosition="left" color="blue" fluid className="mt-10" icon>
              <Icon name="pencil" />
              {i18next.t("Edit")}
            </Button>
          </a>
        </div>
      }
      {permissions?.can_manage &&
        <div className="mb-10">
          <ShareButton
            record={record}
            // TODO: add proper permission for making the button disabled
            disabled={false}
            permissions={permissions}
            groupsEnabled={groupsEnabled}
          />
        </div>
      }
      {(record.expanded?.request_types || recordRequestsExist) &&
        <RecordRequests
          record={record}
          onErrorPlugins={[cfValidationErrorPlugin, handleRedirectToEditFormPlugin]}
          actionExtraContext={{ record }}
        />
      }
    </>
  );
};

RecordActionButtons.propTypes = {
  record: PropTypes.object.isRequired,
  permissions: PropTypes.object.isRequired,
  groupsEnabled: PropTypes.bool.isRequired,
};
