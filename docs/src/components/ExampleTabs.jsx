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

export const ExampleTabs = ({ layout }) => {
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
          <GeneratedUI layout={layout} />
        </code>
      </pre>
    </div>
  )

  return (
    <Tabs>
      <TabItem value="layout" label="Layout" default>
        <CodeBlock language="json" title="layout.json">
          {formattedLayout}
        </CodeBlock>
        {ResultBlock}
      </TabItem>
      <TabItem value="react" label="React" default>
        <CodeBlock language="jsx" live>
          {`<GeneratedUI layout={${formattedLayout}} />`}
        </CodeBlock>
      </TabItem>
      <TabItem value="jinja" label="Jinja2" default>
        <CodeBlock language="django">
          {`<div>
{{
    oarepo_ui.render_layout(layout=${formattedLayout})
}}
</div>`}
        </CodeBlock>
        {ResultBlock}
      </TabItem>
    </Tabs>
  )
}

export default ExampleTabs
