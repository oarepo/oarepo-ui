// This file is part of Invenio-RDM-Records
// Copyright (C) 2020-2023 CERN.
// Copyright (C) 2020-2022 Northwestern University.
//
// Invenio-RDM-Records is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import React from "react";
import { Item, Header, Radio, Grid, Table } from "semantic-ui-react";
import { withState } from "react-searchkit";
import _get from "lodash/get";
import { FastField } from "formik";
import _toPairs from "lodash/toPairs";
import _chunk from "lodash/chunk";
import { i18next } from "@translations/oarepo_ui/i18next";

const VocabularyItemPropsTable = (props) => {
  // Split properties into max. 4 tables of max. 2 rows
  const tables = _chunk(_toPairs(props), 2).slice(0, 4);

  return (
    <Grid celled="internally" columns={tables.length} className="dense">
      {tables.map((tableData, index) => (
        <Grid.Column key={index}>
          <Table basic="very" collapsing compact>
            <Table.Body>
              {tableData.map(([key, value]) => (
                <Table.Row key={key}>
                  <Table.Cell>
                    <b>{i18next.t(key)}</b>
                  </Table.Cell>
                  <Table.Cell>{value}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Grid.Column>
      ))}
    </Grid>
  );
};

export const SelectVocabularyExternalApiResultsList = withState(
  ({ currentResultsState: results, serializeSuggestions }) => {
    return (
      <FastField name="selectedItem">
        {({ form: { values, setFieldValue } }) => (
          <Item.Group>
            {results.data.hits.map((result) => {
              const title = result.title;
              const itemProps = result.props;
              return (
                <Item
                  key={title.cs}
                  onClick={() => setFieldValue("selectedItem", result)}
                  className="license-item mb-15"
                >
                  <Radio
                    checked={_get(values, "selectedItem.title") === title}
                    onChange={() => setFieldValue("selectedItem", result)}
                  />
                  <Item.Content className="license-item-content">
                    <Header size="small" className="mt-0">
                      {title.cs}
                    </Header>
                    {itemProps && (
                      <Item.Description className="license-item-description">
                        <VocabularyItemPropsTable {...itemProps} />
                      </Item.Description>
                    )}
                  </Item.Content>
                </Item>
              );
            })}
          </Item.Group>
        )}
      </FastField>
    );
  }
);
