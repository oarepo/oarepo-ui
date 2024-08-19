import React from "react";
import { useFormikContext, getIn } from "formik";
import { useFormConfig } from "@js/oarepo_ui";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Header, Message, Icon } from "semantic-ui-react";
import { Trans } from "react-i18next";

export const SelectedCommunity = ({ fieldPath }) => {
  const {
    formConfig: { allowed_communities, generic_community },
  } = useFormConfig();
  const { values } = useFormikContext();
  const selectedCommunityId = getIn(values, fieldPath, "");
  let selectedCommunity = allowed_communities.find(
    (c) => c.id === selectedCommunityId
  );
  const isGeneric = generic_community.id === selectedCommunityId;
  if (isGeneric) {
    selectedCommunity = generic_community;
  }
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
        // TODO: get actual link for the documentation
        <Message>
          <Icon name="warning circle" className="text size large" />
          <Trans>
            You are not a member of any community. If you choose to proceed,
            your work will be published in the "generic" community. We strongly
            recommend that you join a community to increase the visibility of
            your work and to cooperate with others more easily. You can check
            the available communities{" "}
            <a
              href="/communities"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              on our communities page.
            </a>{" "}
            For more details on how to join a community please refer to the
            instructions on{" "}
            <a
              href="/documentation-url"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              how to join a community.
            </a>
          </Trans>
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
