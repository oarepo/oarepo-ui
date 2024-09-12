import React from "react";
import { useFormikContext, getIn } from "formik";
import { useFormConfig, CommunityItem } from "@js/oarepo_ui";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Header, Message, Icon, Button, List } from "semantic-ui-react";
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
  console.log(selectedCommunity);
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
      {selectedCommunity && (
        <List>
          <CommunityItem community={selectedCommunity} />
        </List>
      )}
      {!values?.id &&
        allowed_communities.length > 1 &&
        !preselected_community && (
          <Button onClick={handleCommunityRemoval} size="mini">
            {i18next.t("Change")}
          </Button>
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
