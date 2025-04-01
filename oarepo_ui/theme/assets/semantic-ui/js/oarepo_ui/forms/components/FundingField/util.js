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


 export const deserializeFunderToDropdown =(funderItem)=> {
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
  }

  export const serializeFunderFromDropdown=(funderDropObject)=> {
    return {
      id: funderDropObject.key,
      ...(funderDropObject.name && { name: funderDropObject.name }),
    };
  }