import React from "react";
import { Item, Header, Radio, Grid, Table } from "semantic-ui-react";
import { withState } from "react-searchkit";
import _toPairs from "lodash/toPairs";
import _chunk from "lodash/chunk";
import { i18next } from "@translations/oarepo_ui/i18next";

// taken from oarepo vocabularies components/VocabularyResultsListItem => maybe we could move this specific component to oarepo ui as it could be useful in more places like here?

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
  ({
    currentResultsState: results,
    serializeSuggestions,
    handleAddingExternalApiSuggestion,
    handleExternalRecordChange,
    externalApiRecord,
  }) => {
    return (
      <Item.Group>
        {serializeSuggestions(results?.data?.hits).map((record) => {
          console.log(record);
          const title = record.text;
          const itemProps = record.props;
          return (
            <Item
              key={title}
              onClick={() => {
                handleAddingExternalApiSuggestion(record);
                handleExternalRecordChange(record);
              }}
            >
              <Radio
                checked={externalApiRecord.text === title}
                onChange={() => handleExternalRecordChange(record)}
              />
              <Item.Content>
                <Header size="small" className="mt-0">
                  {title}
                </Header>
                {itemProps && (
                  <Item.Description>
                    <VocabularyItemPropsTable {...itemProps} />
                  </Item.Description>
                )}
              </Item.Content>
            </Item>
          );
        })}
      </Item.Group>
    );
  }
);
