// This file is part of InvenioRDM
// Copyright (C) 2020-2024 CERN.
// Copyright (C) 2020-2021 Northwestern University.
// Copyright (C) 2021 Graz University of Technology.
//
// Invenio RDM Records is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import _find from "lodash/find";
import React, { useEffect, useState, useCallback } from "react";
import { Grid, Icon, Message, Placeholder, List } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";
import { Trans } from "react-i18next";
import { ErrorMessage } from "react-invenio-forms";

import { httpApplicationJson } from "..";

const deserializeRecord = (record) => ({
  id: record.id,
  parent: record?.parent,
  parent_id: record?.parent?.id,
  publication_date: record.metadata?.dateIssued,
  version: record?.versions?.index,
  version_note: record.metadata?.version,
  links: record.links,
  pids: record?.metadata.objectIdentifiers,
  new_draft_parent_doi: record?.ui?.new_draft_parent_doi,
});

const NUMBER_OF_VERSIONS = 5;

const RecordVersionItem = ({ item, activeVersion, searchLinkPrefix = "" }) => {
  const doi =
    _find(item.pids, (o) => o.scheme.toLowerCase() === "doi")?.identifier ?? "";
  return (
    <List.Item
      key={item.id}
      {...(activeVersion && { className: "version active" })}
    >
      <List.Content floated="left">
        <List.Header>
          {activeVersion ? (
            <span className="text-break">
              {item.version_note ??
                i18next.t("Version {{- version}}", {
                  version: item.version_note || item.version,
                })}
            </span>
          ) : (
            <a href={`${searchLinkPrefix}/${item.id}`} className="text-break">
              {item.version_note ??
                i18next.t("Version {{- version}}", {
                  version: item.version_note || item.version,
                })}
            </a>
          )}
        </List.Header>

        <List.Description>
          {doi && (
            <div>
              DOI:{" "}
              <a
                href={`https://doi.org/${doi}`}
                className={
                  "doi" + (activeVersion ? " text-muted-darken" : " text-muted")
                }
              >
                {doi}
              </a>
            </div>
          )}
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
        const result = await httpApplicationJson.get(record.links.self, {
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
        const result = await httpApplicationJson.get(
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
                <Trans>
                  <p className="text-muted">
                    <strong>Cite all versions?</strong> You can cite all
                    versions by using the DOI{" "}
                    <a href={recordDeserialized.links.parent_doi}>
                      {{ recordParentDOI }}
                    </a>
                    . This DOI represents all versions, and will always resolve
                    to the latest one. <a href="/help/versioning">Read more</a>.
                  </p>
                </Trans>
              </List.Content>
            </List.Item>
          ) : recordDraftParentDOIFormat ? (
            // new drafts without registered parent dois yet
            <List.Item className="parent-doi pr-0">
              <List.Content floated="left">
                <Trans>
                  <p className="text-muted">
                    <strong>Cite all versions?</strong> You can cite all
                    versions by using the DOI {{ recordDraftParentDOIFormat }}.
                    The DOI is registered when the first version is published.{" "}
                    <a href="/help/versioning">Read more</a>.
                  </p>
                </Trans>
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
