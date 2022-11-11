<!--
 Copyright (c) 2022 CESNET

 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

# OARepo UI

This package provides implementation of base UI components for use in dynamic (React JS) & static (Jinja) pages and
functions to render layouts from model configuration.

## Usage

### React

To render a custom layout in a React app (e. g. records search result page), this package provides the `useLayout` hook. You
can use it like this:

```javascript
import { OARepoRecordResultsListItem } from '@js/oarepo_ui'

// Parent DOM element where the generated layout should be mounted into
const appRoot = document.querySelector('#search-app')

// Layout description object resolved from model.yaml
const searchResultItem = [
  {
    component: 'grid',
    columnsPerRow: 2,
    columns: [
      {
        className: 'result-item-aside two wide',
        style: {
          alignItems: 'center',
        },
    //...
      }
    ]
  }
]

// Data context object
const searchResultItemData = {
  access_status: 'open',
  rights: ['CC BY-ND'],
  title:
    'V\u011bdy o Zemi a souvisej\u00edc\u00ed environment\u00e1ln\u00ed v\u011bdy',
  resource_type: 'Article',
  //...
}

ReactDOM.render(
  <OARepoRecordResultsListItem layout={searchResultItem} data={searchResultItemData} />
  appRoot,
)
```
