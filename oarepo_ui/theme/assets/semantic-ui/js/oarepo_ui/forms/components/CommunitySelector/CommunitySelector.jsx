import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useFormConfig } from "@js/oarepo_ui";
import { useFormikContext, getIn } from "formik";
import { Message, Icon, Modal, List, Button } from "semantic-ui-react";
import { Trans } from "react-i18next";
import { i18next } from "@translations/oarepo_ui/i18next";
import { CommunityItem } from "./CommunityItem";

export const CommunitySelectorField = ({ fieldPath, ...uiProps }) => {
  const { values, setFieldValue } = useFormikContext();
  const {
    formConfig: {
      allowed_communities,
      preselected_community,
      generic_community,
    },
  } = useFormConfig();
  const communitySelected = getIn(values, "parent.communities.default", "");

  useEffect(() => {
    if (!values.id) {
      if (preselected_community) {
        setFieldValue(fieldPath, preselected_community.id);
      } else if (allowed_communities.length === 1) {
        setFieldValue(fieldPath, allowed_communities[0].id);
      }
    }
  }, []);
  const handleClick = (id) => {
    setFieldValue(fieldPath, id);
  };
  return (
    !values.id && (
      <Modal open={!communitySelected}>
        <Modal.Header>{i18next.t("Community selection")}</Modal.Header>
        <Modal.Content>
          <React.Fragment>
            {allowed_communities.length > 1 && (
              <React.Fragment>
                <p>
                  {i18next.t(
                    "Please select community in which your work will be published:"
                  )}
                </p>
                <List selection>
                  {allowed_communities.map((c) => (
                    <CommunityItem
                      key={c.id}
                      community={c}
                      handleClick={handleClick}
                    />
                  ))}
                </List>
              </React.Fragment>
            )}
            {allowed_communities.length === 0 && (
              <React.Fragment>
                {/* TODO: get actual link for the documentation */}
                <Trans>
                  You are not a member of any community. If you choose to
                  proceed, your work will be published in the "generic"
                  community. We strongly recommend that you join a community to
                  increase the visibility of your work and to cooperate with
                  others more easily. You can check the available communities{" "}
                  <a
                    href="/communities"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    here
                  </a>
                  . For more details on how to join a community please refer to
                  the instructions available{" "}
                  <a
                    href="/documentation-url"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    here
                  </a>
                  . If you are certain that you wish to proceed with the generic
                  community, please click on it below.
                </Trans>
                <List selection>
                  <CommunityItem
                    community={generic_community}
                    handleClick={handleClick}
                  />
                </List>
              </React.Fragment>
            )}
            <Message>
              <Icon name="info circle" className="text size large" />
              <span>
                {i18next.t("All records must belong to a community.")}
              </span>
            </Message>
          </React.Fragment>
        </Modal.Content>
        <Modal.Actions className="flex">
          <Button
            type="button"
            className="ml-0"
            icon
            labelPosition="left"
            onClick={() => window.history.go(-1)}
          >
            <Icon name="arrow alternate circle left outline" />
            {i18next.t("Go back")}
          </Button>
        </Modal.Actions>
      </Modal>
    )
  );
};

CommunitySelectorField.propTypes = {
  fieldPath: PropTypes.string,
};

CommunitySelectorField.defaultProps = {
  fieldPath: "parent.communities.default",
};
