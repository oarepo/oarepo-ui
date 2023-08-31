// This file is part of Invenio-RDM-Records
// Copyright (C) 2020-2023 CERN.
// Copyright (C) 2020-2022 Northwestern University.
//
// Invenio-RDM-Records is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import axios from "axios";
import _get from "lodash/get";

const BASE_HEADERS = {
  json: { "Content-Type": "application/json" },
  "vnd+json": {
    "Content-Type": "application/json",
    Accept: "application/vnd.inveniordm.v1+json",
  },
  "octet-stream": { "Content-Type": "application/octet-stream" },
};

export class DepositApiClient {
  /* eslint-disable no-unused-vars */
  constructor(additionalApiConfig, createDraftURL, recordSerializer) {
    if (this.constructor === DepositApiClient) {
      throw new Error("Abstract");
    }

    const additionalHeaders = _get(additionalApiConfig, "headers");
    this.apiHeaders = Object.assign({}, BASE_HEADERS, additionalHeaders);

    this.apiConfig = {
      withCredentials: true,
      xsrfCookieName: "csrftoken",
      xsrfHeaderName: "X-CSRFToken",
      headers: this.apiHeaders.json,
    };
    this.axiosWithConfig = axios.create(this.apiConfig);
    this.cancelToken = axios.CancelToken;
  }

  async createDraft(draft) {
    throw new Error("Not implemented.");
  }

  async saveDraft(draft, draftLinks) {
    throw new Error("Not implemented.");
  }

  async publishDraft(draftLinks) {
    throw new Error("Not implemented.");
  }

  async deleteDraft(draftLinks) {
    throw new Error("Not implemented.");
  }

  async reservePID(draftLinks, pidType) {
    throw new Error("Not implemented.");
  }

  async discardPID(draftLinks, pidType) {
    throw new Error("Not implemented.");
  }

  async createOrUpdateReview(draftLinks, communityId) {
    throw new Error("Not implemented.");
  }

  async deleteReview(draftLinks) {
    throw new Error("Not implemented.");
  }

  async submitReview(draftLinks) {
    throw new Error("Not implemented.");
  }
}

/**
 * API Client for deposits.
 */
export class ApiClient extends DepositApiClient {
  async _createResponse(axiosRequest) {
    try {
      const response = await axiosRequest();
      const data = response.data || {};
      return data;
    } catch (error) {
      const errorData = error.response.data;
      return Promise.reject(errorData);
    }
  }

  /**
   * Calls the API to create a new draft.
   *
   * @param {object} draft - Serialized draft
   */
  async createDraft(createUrl, payload) {
    return this._createResponse(() =>
      this.axiosWithConfig.post(createUrl, payload)
    );
  }

  /**
   * Calls the API to read a pre-existing draft.
   *
   * @param {object} draftLinks - the draft links object
   */
  async readDraft(draftlinks) {
    return this._createResponse(() =>
      this.axiosWithConfig.get(draftlinks.self)
    );
  }

  /**
   * Calls the API to save a pre-existing draft.
   *
   * @param {object} draft - the draft payload
   */
  async saveDraft(draftlinks, payload) {
    console.log("save running with", draftlinks.self);
    return this._createResponse(() =>
      this.axiosWithConfig.put(
        draftlinks.self.replace("https://0.0.0.0:5000", ""),
        payload
      )
    );
  }

  async publishDraft(draftlinks, payload) {
    return this._createResponse(() =>
      this.axiosWithConfig.post(draftlinks.publish, payload)
    );
  }
  async deleteDraft(draftlinks) {
    return this._createResponse(() =>
      this.axiosWithConfig.post(draftlinks.self)
    );
  }
}

export const OARepoDepositApiClient = new ApiClient();
