import React from "react";
import { List, Header, Icon } from "semantic-ui-react";
import Overridable from "react-overridable";
import PropTypes from "prop-types";
import { Image } from "react-invenio-forms";

export const CommunityItem = ({ community, handleClick, renderLinks }) => {
  const { id, title, website, logo, organizations } = community;
  return (
    <Overridable
      id="record-community-selection-item"
      community={community}
      handleClick={handleClick}
      renderLinks={renderLinks}
    >
      <List.Item
        onClick={() => handleClick(id)}
        className="flex align-items-center"
      >
        <div className="ui image community-selector-image">
          <Image src={logo} size="tiny" rounded verticalAlign="top" />
        </div>
        <List.Content>
          <Header size="small">
            {renderLinks ? (
              <a
                onClick={(e) => {
                  e.stopPropagation();
                }}
                href={community.links.self_html}
                target="_blank"
                rel="noopener noreferrer"
              >
                {title}
              </a>
            ) : (
              title
            )}
          </Header>
          {website && renderLinks && (
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
          {organizations && (
            <div>
              <Icon name="building outline" />
              <span>{organizations.map((o) => o.name).join(", ")}</span>
            </div>
          )}
        </List.Content>
      </List.Item>
    </Overridable>
  );
};

CommunityItem.propTypes = {
  community: PropTypes.object.isRequired,
  handleClick: PropTypes.func,
  renderLinks: PropTypes.bool,
};

CommunityItem.defaultProps = {
  renderLinks: true,
};
