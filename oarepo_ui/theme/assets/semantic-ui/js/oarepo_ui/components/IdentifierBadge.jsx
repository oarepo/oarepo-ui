import React from "react";
import PropTypes from "prop-types";
import { Image } from "react-invenio-forms";

export const IconIdentifier = ({
  link,
  badgeTitle,
  icon,
  alt,
  className,
  fallbackImage = "/static/images/square-placeholder.png",
}) => {
  return link ? (
    <span className={`creatibutor-identifier ${className}`}>
      <a
        className="no-text-decoration mr-0"
        href={link}
        aria-label={badgeTitle}
        title={badgeTitle}
        key={link}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          className="inline-id-icon identifier-badge inline"
          src={icon}
          alt={alt}
          fallbackSrc={fallbackImage}
        />
      </a>
    </span>
  ) : (
    <span className={`creatibutor-identifier ${className}`}>
      <Image
        title={badgeTitle}
        className="inline-id-icon identifier-badge inline"
        src={icon}
        alt={alt}
        fallbackSrc={fallbackImage}
      />
    </span>
  );
};

IconIdentifier.propTypes = {
  link: PropTypes.string,
  badgeTitle: PropTypes.string,
  icon: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  fallbackImage: PropTypes.string,
};

export const IdentifierBadge = ({ identifier, creatibutorName, className }) => {
  if (!identifier) return null;

  const { scheme, identifier: identifierValue, url } = identifier;

  const badgeTitle = `${creatibutorName} ${scheme}: ${identifierValue}`;

  const lowerCaseScheme = scheme?.toLowerCase();

  return (
    <IconIdentifier
      link={url}
      badgeTitle={badgeTitle}
      icon={`/static/images/identifiers/${lowerCaseScheme}.svg`}
      alt={`${scheme.toUpperCase()} logo`}
      className={className}
    />
  );
};

IdentifierBadge.propTypes = {
  identifier: PropTypes.shape({
    scheme: PropTypes.string,
    identifier: PropTypes.string,
    url: PropTypes.string,
  }),
  className: PropTypes.string,
  creatibutorName: PropTypes.string,
};
