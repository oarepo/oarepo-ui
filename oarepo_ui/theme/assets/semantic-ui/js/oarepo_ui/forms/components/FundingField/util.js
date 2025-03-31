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
