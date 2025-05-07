import _get from "lodash/get";
import _truncate from "lodash/truncate";
import { CREATIBUTOR_TYPE } from "./type";

export const serializeAffiliations = (affiliations) =>
  affiliations.map((affiliation) => ({
    text: affiliation.acronym
      ? `${affiliation.name} (${affiliation.acronym})`
      : affiliation.name,
    value: affiliation.name || affiliation.id,
    key: affiliation.id,
    id: affiliation.id,
    name: affiliation.name,
  }));

export const creatibutorNameDisplay = (value) => {
  const creatibutorType = _get(
    value,
    "person_or_org.type",
    CREATIBUTOR_TYPE.PERSON
  );
  const isPerson = creatibutorType === CREATIBUTOR_TYPE.PERSON;

  const familyName = _get(value, "person_or_org.family_name", "");
  const givenName = _get(value, "person_or_org.given_name", "");
  const affiliationName = _get(value, `affiliations[0].name`, "");
  const name = _get(value, `person_or_org.name`);

  const affiliation = affiliationName ? ` (${affiliationName})` : "";

  let displayName;
  if (isPerson) {
    const givenNameSuffix = givenName ? `, ${givenName}` : "";
    displayName = `${familyName}${givenNameSuffix}${affiliation}`;
  } else {
    displayName = `${name}${affiliation}`;
  }

  return _truncate(displayName, { length: 60 });
};

const splitOnce = (str, separator) => {
  const index = str.indexOf(separator);

  if (index === -1) {
    return [str];
  }

  const firstPart = str.substring(0, index);
  const secondPart = str.substring(index + separator.length);

  return [firstPart, secondPart];
};

/**
 * Function to transform formik creatibutor state
 * back to the external format.
 */
export const serializeCreatibutor = (submittedCreatibutor) => {
  const identifiersFieldPath = "person_or_org.identifiers";
  const affiliationsFieldPath = "affiliations";
  // The modal is saving only identifiers values, thus
  // identifiers with existing scheme are trimmed
  // Here we merge back the known scheme for the submitted identifiers

  const submittedIdentifiers = _get(
    submittedCreatibutor,
    identifiersFieldPath,
    []
  );
  const identifiers = submittedIdentifiers.map((submittedIdentifier) => {
    const [scheme, identifier] = splitOnce(submittedIdentifier, ":");
    return { scheme: scheme, identifier };
  });

  const submittedAffiliations = _get(
    submittedCreatibutor,
    affiliationsFieldPath,
    []
  );

  return {
    ...submittedCreatibutor,
    person_or_org: {
      ...submittedCreatibutor.person_or_org,
      identifiers,
    },
    affiliations: submittedAffiliations.map((affiliation) => ({
      id: affiliation.id,
      name: affiliation.name,
    })),
  };
};

/**
 * Function to transform creatibutor object
 * to formik initialValues. The function is converting
 * the array of objects fields e.g `identifiers`, `affiliations`
 * to simple arrays. This is needed as SUI dropdowns accept only
 * array of strings as values.
 */
export const deserializeCreatibutor = (initialCreatibutor) => {
  const identifiersFieldPath = "person_or_org.identifiers";

  return {
    // Default type to personal
    person_or_org: {
      type: CREATIBUTOR_TYPE.PERSON,
      ...initialCreatibutor.person_or_org,
      identifiers: _get(initialCreatibutor, identifiersFieldPath, []).map(
        (identifier) => `${identifier.scheme}:${identifier.identifier}`
      ),
    },
    affiliations: _get(initialCreatibutor, "affiliations", []),
    role: _get(initialCreatibutor, "role", ""),
  };
};
