export const serializer = (items) => {
  return items.map((item) => ({
    text: item.title_l10n,
    value: item.id,
    key: item.id,
  }));
};
