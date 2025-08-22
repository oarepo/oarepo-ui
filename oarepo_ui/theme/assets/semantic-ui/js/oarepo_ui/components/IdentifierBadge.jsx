import React from "react";
import PropTypes from "prop-types";
import { Image } from "react-invenio-forms";

/**
 * IconIdentifier renders an identifier icon, optionally wrapped in an anchor link.
 *
 * Typically used to display provider or authority icons (e.g., ORCID, DOI).
 * If a `link` is provided, the icon becomes a clickable external link.
 */
export const IconIdentifier = ({
  /**
   * Optional external URL. If provided, the icon will be wrapped
   * in an anchor tag that opens in a new tab.
   */
  link,
  /**
   * Tooltip and accessibility label for the icon.
   * Appears as the `title` attribute on the element.
   */
  badgeTitle = "",
  /**
   * Path or URL to the icon image.
   */
  icon,
  /**
   * Alternative text for the icon (for screen readers).
   */
  alt = "",
  /**
   * Additional CSS classes applied to the wrapper element.
   */
  className = "",
  /**
   * Fallback image path if the provided icon fails to load.
   */
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

/* eslint-disable react/require-default-props */
IconIdentifier.propTypes = {
  /** Optional external URL for the identifier. */
  link: PropTypes.string,
  /** Tooltip and accessibility label for the icon. */
  badgeTitle: PropTypes.string,
  /** Path or URL to the icon image. */
  icon: PropTypes.string,
  /** Alternative text for the icon image. */
  alt: PropTypes.string,
  /** Additional CSS classes. */
  className: PropTypes.string,
  /** Fallback image if the main icon fails to load. */
  fallbackImage: PropTypes.string,
};
/* eslint-enable react/require-default-props */

/**
 * IdentifierBadge renders an identifier badge for a "creatibutor"
 * (creator or contributor).
 *
 * It combines scheme, identifier value, and optional name into
 * a descriptive tooltip, and automatically resolves the icon
 * from `/static/images/identifiers/{scheme}.svg`.
 */
export const IdentifierBadge = ({
  /**
   * Identifier object containing scheme, value, and optional URL.
   * Example:
   * ```js
   * {
   *   scheme: "orcid",
   *   identifier: "0000-0002-1825-0097",
   *   url: "https://orcid.org/0000-0002-1825-0097"
   * }
   * ```
   */
  identifier,
  /**
   * Optional name of the creatibutor (creator/contributor).
   * Included in the tooltip (e.g., "Alice ORCID: 0000-0002-1825-0097").
   */
  creatibutorName = "",
  /**
   * Additional CSS classes applied to the badge wrapper.
   */
  className = "",
}) => {
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
  /** Identifier object with scheme, value, and URL. */
  identifier: PropTypes.shape({
    scheme: PropTypes.string,
    identifier: PropTypes.string,
    url: PropTypes.string,
  }).isRequired,
  /** Additional CSS classes applied to the wrapper. */
  className: PropTypes.string,
  /** Optional creatibutor (author/contributor) name. */
  creatibutorName: PropTypes.string,
};
