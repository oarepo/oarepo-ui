import { getTitleFromMultilingualObject } from "../../../util";

export const deserializeFunder = (funder) => {
  return {
    id: funder?.id,
    name: funder?.name,
    ...(funder?.title_l10n && { title: funder.title_l10n }),
    ...(funder?.country && { country: funder.country }),
    ...(funder?.country_name && {
      country_name: funder.country_name,
    }),
    ...(funder?.identifiers && {
      identifiers: funder.identifiers,
    }),
  };
};

export const deserializeFunderToDropdown = (funderItem) => {
  const funderName = funderItem?.name;
  const funderPID = funderItem?.id;
  const funderCountry = funderItem?.country_name ?? funderItem?.country;

  if (!funderName && !funderPID) {
    return {};
  }

  return {
    text: [funderName, funderCountry, funderPID]
      .filter((val) => val)
      .join(", "),
    value: funderItem.id,
    key: funderItem.id,
    ...(funderName && { name: funderName }),
  };
};

export const serializeFunderFromDropdown = (funderDropObject) => {
  return {
    id: funderDropObject.key,
    ...(funderDropObject.name && { name: funderDropObject.name }),
  };
};

export const deserializeAward = (award) => {
  return {
    title: award.title_l10n,
    number: award.number,
    id: award.id,
    ...(award.identifiers && {
      identifiers: award.identifiers,
    }),
    ...(award.acronym && { acronym: award.acronym }),
  };
};

export const computeFundingContents = (funding) => {
  let headerContent,
    descriptionContent,
    awardOrFunder = "";

  if (funding.funder) {
    const funderName =
      funding.funder?.name ?? funding.funder?.title ?? funding.funder?.id ?? "";
    awardOrFunder = "funder";
    headerContent = funderName;
    descriptionContent = "";

    // there cannot be an award without a funder
    if (funding.award) {
      const { acronym, title } = funding.award;
      awardOrFunder = "award";
      descriptionContent = funderName;
      headerContent = acronym
        ? `${acronym} — ${getTitleFromMultilingualObject(title)}`
        : getTitleFromMultilingualObject(title);
    }
  }

  return { headerContent, descriptionContent, awardOrFunder };
};
