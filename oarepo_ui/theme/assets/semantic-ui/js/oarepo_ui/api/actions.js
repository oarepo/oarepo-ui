import { OARepoDepositApiClient } from "./client";

export const save = async (draft) => {
  const draftExists = !!draft.id;
  let response;
  if (draftExists) {
    response = await OARepoDepositApiClient.saveDraft(draft.links, draft);
    return response;
  } else {
    response = OARepoDepositApiClient.createDraft(draft);
    return response;
  }
};

export const _delete = async (draft) => {
  const response = await OARepoDepositApiClient.deleteDraft(draft.links);
  return response;
};

export const publish = async (draft, responseWithLinks) => {
  const response = await OARepoDepositApiClient.publishDraft(
    responseWithLinks.links,
    draft
  );
  return response;
};
