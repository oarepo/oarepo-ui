import { OARepoDepositApiClient } from "./client";

export const save = async (draft, createUrl) => {
  const draftExists = !!draft.id;
  console.log(draftExists, draft);
  let response;
  if (draftExists) {
    response = await OARepoDepositApiClient.saveDraft(draft.links, draft);
    return response;
  } else {
    response = OARepoDepositApiClient.createDraft(createUrl, draft);
    return response;
  }
};

export const _delete = async (draft) => {
  console.log(draft);
  let response = await OARepoDepositApiClient.deleteDraft(draft.links);
  return response;
};

export const publish = async (draft) => {
  const responseWithLinks = await save(draft);
  let response = await OARepoDepositApiClient.publishDraft(
    responseWithLinks.links.publish.replace("https://0.0.0.0:5000", ""),
    draft
  );
  return response;
};
