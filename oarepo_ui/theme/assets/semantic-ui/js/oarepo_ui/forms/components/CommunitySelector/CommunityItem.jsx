import React from "react";
import { List, Header, Icon } from "semantic-ui-react";
import Overridable from "react-overridable";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Image } from "react-invenio-forms";

export const CommunityItem = ({ community, handleClick }) => {
  console.log(community);
  const { id, title, description, website, logo } = community;
  return (
    <Overridable
      id="record-community-selection-item"
      community={community}
      handleClick={handleClick}
    >
      <List.Item onClick={() => handleClick(id)} className="flex">
        <div className="ui image community-image">
          <Image src={logo} size="tiny" rounded verticalAlign="top" />
        </div>
        <List.Content>
          <Header size="small">
            <a
              onClick={(e) => e.stopPropagation()}
              href={community.links.self_html}
              target="_blank"
              rel="noopener noreferrer"
            >
              {title}
            </a>
          </Header>
          {description && <p className="mb-5">{description}</p>}
          {website && (
            <React.Fragment>
              <Icon name="linkify" />
              <a
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                href={website}
              >
                {website}
              </a>
            </React.Fragment>
          )}
        </List.Content>
      </List.Item>
    </Overridable>
  );
};

CommunityItem.propTypes = {
  community: PropTypes.object.isRequired,
  handleClick: PropTypes.func.isRequired,
};
