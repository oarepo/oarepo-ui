// This file is part of InvenioRDM
// Copyright (C) 2024 CERN.
//
// Invenio RDM Records is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import { http } from "react-invenio-forms";

import { useSuggestionApi } from "../../../forms";

export class GrantAccessApi {
  constructor(record) {
    this.endpoint = record.links.access_grants;
  }

  createGrants = async (entities, permission, message, notify) => {
    const grants = [];
    for (const [entityId, entity] of Object.entries(entities)) {
      const grant = {
        subject: {
          type: entity.type,
          id: entityId,
        },
        permission: permission,
      };

      if (notify) {
        grant.notify = notify;
      }

      if (message) {
        grant.message = message;
      }

      grants.push(grant);
    }

    const payload = { grants: grants };
    await http.post(this.endpoint, payload);
  };
}

export const useEntitiesSugestionsApi = (searchType) => {
  let suggestionApiUrlSuffix;

  if (searchType === "user") {
    suggestionApiUrlSuffix = "names";
  } else if (searchType === "role") {
    suggestionApiUrlSuffix = "communities";
  }
  const {
    suggestions: searchResults,
    loading: suggestionsLoading,
    error: suggestionsError,
    query: searchQuery,
    noResults,
    executeSearch: getSuggestions,
  } = useSuggestionApi({
    suggestionAPIUrl: `/api/${suggestionApiUrlSuffix}`,
  });
  
  return {
    getSuggestions,
  };
}
