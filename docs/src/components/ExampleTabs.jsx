// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import CodeBlock from '@theme/CodeBlock'
import { GeneratedLayout } from 'react-generative-ui'
import _toString from 'lodash/toString'
import _isEmpty from 'lodash/isEmpty'
import _transform from 'lodash/transform'
import _get from 'lodash/get'

export const ExampleTabs = ({ data = {}, noResult = true, layout }) => {
  const formattedData = JSON.stringify(data, null, 2)

  // TODO: this one is faked due to React live
  // editor having problems with useContext()
  const resolvedLayout = layout.map((item) =>
    _transform(item, (result, _value, key) => {
      if (key === 'data') {
        delete result[key]
        result['children'] = _get(data, _value)
      } else {
        result[key] = _value
      }
    }),
  )

  const formattedLayout = JSON.stringify(layout, null, 2)

  const ResultBlock = (
    <div
      style={{
        backgroundColor: 'var(--ifm-color-emphasis-200)',
        fontSize: 'var(--ifm-code-font-size)',
      }}
    >
      <h4 style={{ padding: '0.75rem 0 0 0.75rem' }}>RESULT</h4>
      <pre>
        <code>
          <GeneratedLayout layout={resolvedLayout} />
        </code>
      </pre>
    </div>
  )

  const tabs = [
    {
      title: 'Layout',
      file: 'layout.json',
      content: formattedLayout,
    },
    {
      title: 'React',
      lang: 'jsx',
      // Data-enabled live editor crashes on useContext()
      content: `<GeneratedLayout${
        !_isEmpty(data) ? '\ndata={' + formattedData + '}' : ''
      }\nlayout={${formattedLayout}} />`,
    },
    {
      title: 'Jinja2',
      lang: 'django',
      content: `<div>{{\noarepo_ui.render_layout(  ${
        !_isEmpty(data) ? '\ndata=' + formattedData + ',' : ''
      }\nlayout=${formattedLayout},\n)\n}}</div>`,
    },
  ]

  const fullTabs = _isEmpty(data)
    ? tabs
    : [
        ...tabs,
        ...[
          {
            title: 'Data',
            file: 'data.json',
            content: formattedData,
          },
        ],
      ]

  return (
    <Tabs>
      {fullTabs.map(
        ({ title, lang = 'json', file, content, live, ...rest }, index) => (
          <TabItem
            key={index}
            value={title}
            label={title}
            default={index === 0}
            {...rest}
          >
            <CodeBlock
              language={lang}
              {...(file && { title: file })}
              {...(live && { live: true })}
            >
              {content}
            </CodeBlock>
            {!live && !noResult && ResultBlock}
          </TabItem>
        ),
      )}
    </Tabs>
  )
}

export default ExampleTabs
