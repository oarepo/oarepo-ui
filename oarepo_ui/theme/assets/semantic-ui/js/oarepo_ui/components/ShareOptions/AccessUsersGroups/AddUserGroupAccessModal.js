import React, { useState } from "react";
import { Button, Modal, Checkbox } from "semantic-ui-react";
import { i18next } from "@translations/invenio_app_rdm/i18next";
import PropTypes from "prop-types";
import { SearchWithRoleSelection } from "@js/invenio_communities/members";
import { RichEditor } from "react-invenio-forms";
import { GrantAccessApi, useEntitiesSugestionsApi } from "../api/api";
import { UsersApi } from "@js/invenio_communities/api";
import { GroupsApi } from "@js/invenio_communities/api";

export const AddUserGroupAccessModal = ({
  record,
  results,
  isComputer,
  accessDropdownOptions,
  onGrantAddedOrDeleted,
  endpoint,
  searchType,
}) => {
  const [open, setOpen] = useState(false);
  const [notifyUser, setNotifyUser] = useState(true);
  const [message, setMessage] = useState(undefined);

  const {
    getSuggestions
  } = useEntitiesSugestionsApi(searchType);

  const onSuccess = () => {
    onGrantAddedOrDeleted(`${endpoint}?expand=true`, searchType);
    handleCloseModal();
  };

  const handleNotifyCheckboxClick = () => {
    setNotifyUser(!notifyUser);
  };

  const handleOpenModal = () => setOpen(true);
  const handleCloseModal = () => {
    setOpen(false);
    setNotifyUser(true);
  };

  const searchEntities = () => {
    return getSuggestions
  };

  const api = new GrantAccessApi(record);

  const existingIds = [record.parent?.access?.owned_by?.user];
  results.forEach((result) => {
    existingIds.push(result?.subject?.id);
  });

  const config = {
    user: {
      addButtonText: i18next.t("Add people"),
      searchBarTitle: i18next.t("User"),
      selectedItemsHeader: i18next.t("No selected users"),
      searchBarTooltip: i18next.t(
        "Search for users to grant access (only users with a public profile can be invited)"
      ),
      searchBarPlaceholder: i18next.t("Search by email, full name or username"),
      doneButtonTipType: i18next.t("users"),
    },
    role: {
      addButtonText: i18next.t("Add groups"),
      searchBarTitle: i18next.t("Group"),
      selectedItemsHeader: i18next.t("No selected groups"),
      searchBarPlaceholder: i18next.t("Search for groups"),
      doneButtonTipType: i18next.t("groups"),
    },
  };

  const {
    addButtonText,
    searchBarTitle,
    selectedItemsHeader,
    searchBarTooltip,
    searchBarPlaceholder,
    doneButtonTipType,
  } = config[searchType] || {};

  return (
    <Modal
      role="dialog"
      closeIcon
      onClose={handleCloseModal}
      onOpen={handleOpenModal}
      closeOnDimmerClick={false}
      open={open}
      aria-label={addButtonText}
      trigger={
        <Button
          className={!isComputer ? "mobile only tablet only mb-15" : ""}
          content={addButtonText}
          positive
          size="medium"
          icon="plus"
          labelPosition="left"
          floated={!isComputer ? "right" : undefined}
        />
      }
    >
      <Modal.Header as="h2">{addButtonText}</Modal.Header>
      <SearchWithRoleSelection
        key="access-users"
        roleOptions={accessDropdownOptions}
        modalClose={handleCloseModal}
        action={api.createGrants}
        fetchMembers={searchEntities()}
        onSuccessCallback={onSuccess}
        searchBarTitle={<label>{searchBarTitle}</label>}
        searchBarTooltip={searchBarTooltip}
        doneButtonText={i18next.t("Add")}
        doneButtonIcon="plus"
        radioLabel={i18next.t("Access")}
        selectedItemsHeader={selectedItemsHeader}
        message={message}
        searchType={searchType}
        messageComponent={
          <>
            <Checkbox
              checked={notifyUser}
              className="mb-20 mt-10"
              label={i18next.t("Notify people")}
              onClick={handleNotifyCheckboxClick}
            />
            {notifyUser && (
              <>
                <p>
                  <b>{i18next.t("Notification message")}</b>
                </p>
                <RichEditor
                  inputValue={() => message} // () => Avoid re-rendering
                  onBlur={(event, editor) => {
                    setMessage(editor.getContent());
                  }}
                />
              </>
            )}
          </>
        }
        notify={notifyUser}
        doneButtonTip={i18next.t("You are about to add")}
        doneButtonTipType={doneButtonTipType}
        existingEntities={existingIds}
        existingEntitiesDescription={i18next.t("Access already granted")}
        searchBarPlaceholder={searchBarPlaceholder}
      />
    </Modal>
  );
};

AddUserGroupAccessModal.propTypes = {
  record: PropTypes.object.isRequired,
  results: PropTypes.array.isRequired,
  isComputer: PropTypes.bool.isRequired,
  accessDropdownOptions: PropTypes.array.isRequired,
  onGrantAddedOrDeleted: PropTypes.func.isRequired,
  endpoint: PropTypes.string.isRequired,
  searchType: PropTypes.oneOf(["group", "role", "user"]).isRequired,
};
