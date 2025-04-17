// This file is part of InvenioRDM
// Copyright (C) 2020-2024 CERN.
// Copyright (C) 2020-2021 Northwestern University.
// Copyright (C) 2021 Graz University of Technology.
//
// Invenio RDM Records is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import React, { useEffect, useState, useCallback } from "react";
import { Grid, Icon, Message, Placeholder, List } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";
import { ErrorMessage } from "react-invenio-forms";

import { httpVnd } from "..";

// unfortunately, Trans component and interpolation, have some weird issue, where
// the / in the doi gets escaped, and even though you tell it to not escape, it still escapes it
const ParentDoiMessage = ({ parentDoiObject }) => {
  return (
    <p className="text-muted">
      <strong>{i18next.t("Cite all versions?")}</strong>{" "}
      {i18next.t("You can cite all versions by using the DOI")}{" "}
      {parentDoiObject?.url ? (
        <a href={parentDoiObject.url} target="_blank" rel="noopener noreferrer">
          {parentDoiObject?.identifier}
        </a>
      ) : (
        <span>{parentDoiObject?.identifier}</span>
      )}
      {". "}
      {i18next.t(
        "This DOI represents all versions, and will always resolve to the latest one."
      )}{" "}
      <a href="/help/versioning">{i18next.t("Read more.")}</a>
    </p>
  );
};

ParentDoiMessage.propTypes = {
  parentDoiObject: PropTypes.object.isRequired,
};

const DraftParentDoiMessage = ({ recordDraftParentDOIFormat }) => (
  <p className="text-muted">
    <strong>{i18next.t("Cite all versions?")}</strong>{" "}
    {i18next.t("You can cite all versions by using the DOI")}{" "}
    {recordDraftParentDOIFormat}.{" "}
    {i18next.t("The DOI is registered when the first version is published.")}{" "}
    <a href="/help/versioning">{i18next.t("Read more.")}</a>.
  </p>
);

DraftParentDoiMessage.propTypes = {
  recordDraftParentDOIFormat: PropTypes.string.isRequired,
};

const deserializeRecord = (record) => ({
  id: record.id,
  parent: record?.parent,
  parent_id: record?.parent?.id,
  publication_date: record.metadata?.dateIssued,
  version: record?.versions?.index,
  version_note: record.metadata?.version,
  links: record.links,
  pids: record?.pids,
  new_draft_parent_doi: record?.ui?.new_draft_parent_doi,
});

const NUMBER_OF_VERSIONS = 5;

const RecordVersionItem = ({ item, activeVersion, searchLinkPrefix = "" }) => {
  const doi = item?.pids.doi?.identifier;
  const doiLink = item?.pids.doi?.url;

  return (
    <List.Item
      key={item.id}
      {...(activeVersion && { className: "version active" })}
    >
      <List.Content floated="left">
        <List.Header>
          {activeVersion ? (
            <span className="text-break">
              {/* As we now return a number in UI serialization for metadata.version, 
              the most common scenario is that you will have there a number or vNumber */}
              {i18next.t("Version {{- version}}", {
                version: item.version_note || item.version,
              })}
            </span>
          ) : (
            <a href={`${searchLinkPrefix}/${item.id}`} className="text-break">
              {i18next.t("Version {{- version}}", {
                version: item.version_note || item.version,
              })}
            </a>
          )}
        </List.Header>

        <List.Description>
          <div className="rel-mt-1">
            {doiLink ? (
              <a
                href={doiLink}
                className={
                  "doi" + (activeVersion ? " text-muted-darken" : " text-muted")
                }
              >
                {doi}
              </a>
            ) : (
              <span
                className={
                  "doi" + (activeVersion ? " text-muted-darken" : " text-muted")
                }
              >
                {doi}
              </span>
            )}
          </div>
        </List.Description>
      </List.Content>

      <List.Content floated="right">
        <small className={activeVersion ? "text-muted-darken" : "text-muted"}>
          {item.publication_date}
        </small>
      </List.Content>
    </List.Item>
  );
};

RecordVersionItem.propTypes = {
  item: PropTypes.object.isRequired,
  activeVersion: PropTypes.bool.isRequired,
  searchLinkPrefix: PropTypes.string,
};

const PreviewMessage = () => {
  return (
    <Message info className="no-border-radius m-0">
      <Message.Header>
        <Icon name="eye" />
        {i18next.t("Preview")}
      </Message.Header>
      <p>{i18next.t("Only published versions are displayed.")}</p>
    </Message>
  );
};

export const RecordVersionsList = ({ uiRecord, isPreview }) => {
  const [record, setRecord] = useState(uiRecord);
  const recordDeserialized = deserializeRecord(record);
  const recordParentDOI = recordDeserialized?.parent?.pids?.doi?.identifier;
  const recordDraftParentDOIFormat = recordDeserialized?.new_draft_parent_doi;
  const recid = recordDeserialized.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recordVersions, setRecordVersions] = useState({});

  const fetchRecordAndSetState = useCallback(
    async (signal) => {
      try {
        const result = await httpVnd.get(record.links.self, {
          signal,
        });
        setRecord(result.data);
      } catch (error) {
        setError(i18next.t("An error occurred while fetching the record."));
      }
    },
    [record.links.self]
  );

  const fetchVersionsAndSetState = useCallback(
    async (signal) => {
      try {
        const result = await httpVnd.get(
          `${record.links.versions}?size=${NUMBER_OF_VERSIONS}&sort=version&allversions=true`,
          {
            signal,
          }
        );
        let { hits, total } = result.data.hits;
        hits = hits.map(deserializeRecord);
        setRecordVersions({ hits, total });
        setLoading(false);
      } catch (error) {
        setError(i18next.t("An error occurred while fetching the versions."));
      }
    },
    [record.links.versions]
  );

  const fetchData = useCallback(
    async (signal) => {
      try {
        await fetchRecordAndSetState(signal);
        await fetchVersionsAndSetState(signal);
      } catch (error) {
        setLoading(false);
      }
    },
    [fetchRecordAndSetState, fetchVersionsAndSetState]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchData]);

  const loadingcmp = () => {
    return isPreview ? (
      <PreviewMessage />
    ) : (
      <>
        <div className="rel-p-1" />
        <Placeholder className="rel-ml-1 rel-mr-1">
          <Placeholder.Header>
            <Placeholder.Line />
            <Placeholder.Line />
            <Placeholder.Line />
          </Placeholder.Header>
        </Placeholder>
      </>
    );
  };

  const errorMessagecmp = () => (
    <ErrorMessage
      className="rel-mr-1 rel-ml-1"
      content={i18next.t(error)}
      negative
    />
  );

  const searchLinkPrefix = uiRecord.links?.search_link.endsWith("/")
    ? uiRecord.links.search_link.slice(0, -1)
    : uiRecord.links?.search_link;

  const recordVersionscmp = () => (
    <>
      {isPreview ? <PreviewMessage /> : null}
      {recordVersions.total > 0 && (
        <List relaxed divided>
          {recordVersions.hits.map((item) => (
            <RecordVersionItem
              key={item.id}
              item={item}
              activeVersion={item.id === recid}
              searchLinkPrefix={searchLinkPrefix}
            />
          ))}
          {recordVersions.total > 1 && (
            <Grid className="mt-0">
              <Grid.Row centered>
                <a
                  href={`${searchLinkPrefix}?q=parent.id:${recordDeserialized.parent_id}&sort=newest&f=allversions:true`}
                  className="font-small"
                >
                  {i18next.t(`View all {{count}} versions`, {
                    count: recordVersions.total,
                  })}
                </a>
              </Grid.Row>
            </Grid>
          )}
          {recordParentDOI ? (
            <List.Item className="parent-doi pr-0">
              <List.Content floated="left">
                <ParentDoiMessage
                  parentDoiObject={recordDeserialized?.parent?.pids?.doi}
                />
              </List.Content>
            </List.Item>
          ) : recordDraftParentDOIFormat ? (
            // new drafts without registered parent dois yet
            <List.Item className="parent-doi pr-0">
              <List.Content floated="left">
                <DraftParentDoiMessage
                  recordDraftParentDOIFormat={recordDraftParentDOIFormat}
                />
              </List.Content>
            </List.Item>
          ) : null}
        </List>
      )}
    </>
  );

  return loading
    ? loadingcmp()
    : error
    ? errorMessagecmp()
    : recordVersionscmp();
};

RecordVersionsList.propTypes = {
  uiRecord: PropTypes.object.isRequired,
  isPreview: PropTypes.bool.isRequired,
};
