// This file is part of Invenio-RDM-Records
// Copyright (C) 2020-2023 CERN.
// Copyright (C) 2020-2022 Northwestern University.
//
// Invenio-RDM-Records is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import React from "react";
import { Item, Header, Radio } from "semantic-ui-react";
import { withState } from "react-searchkit";
import _get from "lodash/get";
import { FastField } from "formik";

export const SelectVocabularyExternalApiResultsList = withState(
  ({ currentResultsState: results, serializeSuggestions }) => {
    return (
      <FastField name="selectedItem">
        {({ form: { values, setFieldValue } }) => (
          <Item.Group>
            {results.data.hits.map((result) => {
              const title = result["title"];
              const description = result["description"];
              return (
                <Item
                  key={title.cs}
                  onClick={() => setFieldValue("selectedItem", result)}
                  className="license-item mb-15"
                >
                  <Radio
                    checked={_get(values, "selectedItem.title") === title}
                    onChange={() => setFieldValue("selectedItem", result)}
                    {...(!description && { className: "mt-0" })}
                  />
                  <Item.Content className="license-item-content">
                    <Header size="small" className="mt-0">
                      {title.cs}
                    </Header>
                    {description && (
                      <Item.Description className="license-item-description">
                        {description}
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
