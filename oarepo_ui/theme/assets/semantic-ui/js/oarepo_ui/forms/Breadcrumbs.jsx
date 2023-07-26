import React from "react";
import { Breadcrumb } from "semantic-ui-react";
import PropTypes from "prop-types";

export const VocabularyBreadcrumb = ({ icon, sections }) => {
  const breadcrumbSections = sections.map((item, index) => {
    if (index === sections.length - 1) {
      return (
        <Breadcrumb.Section icon={icon} key={item.key}>
          {item.content}
        </Breadcrumb.Section>
      );
    }
    return (
      <React.Fragment key={item.key}>
        {/* URL hard coded for testing purposes, will be getting URL from type value from formConfig */}
        <Breadcrumb.Section href={`/vocabularies/institutions/${item.key}`}>
          {item.content}
        </Breadcrumb.Section>
        <Breadcrumb.Divider icon={icon} />
      </React.Fragment>
    );
  });
  return <Breadcrumb>{breadcrumbSections}</Breadcrumb>;
};

VocabularyBreadcrumb.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
    })
  ).isRequired,
};

VocabularyBreadcrumb.defaultProps = {
  icon: "right angle",
};
