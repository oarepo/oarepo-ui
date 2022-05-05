// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import CodeBlock from '@theme/CodeBlock'
import { GeneratedUI } from 'react-generative-ui'
import _toString from 'lodash/toString'
import _isEmpty from 'lodash/isEmpty'

export const ExampleTabs = ({ data = {}, layout }) => {
  const formattedData = JSON.stringify(data, null, 2)
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
          <GeneratedUI data={data} layout={layout} />
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
      live: true,
      content: `<GeneratedUI${
        !_isEmpty(data) ? '\ndata={' + formattedData + '}' : ''
      }\nlayout={${formattedLayout}} />`,
    },
    {
      title: 'Jinja2',
      lang: 'django',
      content: `<div>{{\noarepo_ui.render_layout(\n  layout=${formattedLayout},\n${
        !_isEmpty(data) ? ',\ndata=' + formattedData : ''
      })\n}}</div>`,
    },
    {
      ...(!_isEmpty(data) && {
        title: 'Data',
        file: 'data.json',
        content: formattedData,
      }),
    },
  ]

  return (
    <Tabs>
      {tabs.map(({ title, lang = 'json', file, content, live }, index) => (
        <TabItem key={index} value={title} label={title} default={index === 0}>
          <CodeBlock
            language={lang}
            {...(file && { title: file })}
            {...(live && { live: true })}
          >
            {content}
          </CodeBlock>
          {!live && ResultBlock}
        </TabItem>
      ))}
    </Tabs>
  )
}

export default ExampleTabs
