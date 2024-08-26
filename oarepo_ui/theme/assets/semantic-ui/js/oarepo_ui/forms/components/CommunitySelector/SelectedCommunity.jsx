import React from "react";
import { useFormikContext, getIn } from "formik";
import { useFormConfig } from "@js/oarepo_ui";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Header, Message, Icon, Button } from "semantic-ui-react";
import { GenericCommunityMessage } from "./CommunitySelector";

export const SelectedCommunity = ({ fieldPath }) => {
  const {
    formConfig: {
      allowed_communities,
      generic_community,
      preselected_community,
    },
  } = useFormConfig();
  const { values, setFieldValue } = useFormikContext();
  const selectedCommunityId = getIn(values, fieldPath, "");
  let selectedCommunity = allowed_communities.find(
    (c) => c.id === selectedCommunityId
  );
  const isGeneric = generic_community.id === selectedCommunityId;
  if (isGeneric) {
    selectedCommunity = generic_community;
  }
  const handleCommunityRemoval = () => {
    setFieldValue(fieldPath, "");
  };
  return (
    <React.Fragment>
      {values?.id ? (
        <p>
          {i18next.t(
            "Your record will be published in the following community:"
          )}
        </p>
      ) : (
        <p>
          {i18next.t(
            "Your work will be saved in the following community. Please note that after saving it will not be possible to transfer it to another community."
          )}
        </p>
      )}
      <div className="flex center aligned">
        <Header as="h3" className="m-0">
          {/* TODO: the link is to the community landing page which is not yet ready */}
          <a
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            href={selectedCommunity?.links?.self_html}
            aria-label={i18next.t("Community home page")}
          >
            {selectedCommunity?.title}
          </a>
        </Header>
        {!values?.id &&
          allowed_communities.length > 1 &&
          !preselected_community && (
            <Button
              className="rel-ml-1"
              onClick={handleCommunityRemoval}
              size="mini"
            >
              {i18next.t("Change")}
            </Button>
          )}
      </div>

      <p>{selectedCommunity?.description}</p>
      {selectedCommunity?.website && (
        <span>
          <a
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            href={selectedCommunity?.website}
          >
            {i18next.t("Community website.")}
          </a>
        </span>
      )}
      {isGeneric ? (
        <Message>
          <Icon name="warning circle" className="text size large" />
          <GenericCommunityMessage />
        </Message>
      ) : null}
    </React.Fragment>
  );
};

SelectedCommunity.propTypes = {
  fieldPath: PropTypes.string,
};

SelectedCommunity.defaultProps = {
  fieldPath: "parent.communities.default",
};
