// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { Placeholder as SemanticPlaceholder } from 'semantic-ui-react'
import _times from 'lodash/times'

/**
 * A placeholder used to reserve space for content that soon will appear in a layout.
 */
const Placeholder = ({ config }) => {
  const {
    component,
    type = 'paragraph',
    lines = 1,
    fluid = true,
    ...restInnerProps
  } = config
  const { square, ...rest } = restInnerProps

  const ParagraphPlaceholder = (
    <SemanticPlaceholder.Paragraph>
      {_times(lines || 1, (num) => (
        <SemanticPlaceholder.Line {...restInnerProps} key={num.toString()} />
      ))}
    </SemanticPlaceholder.Paragraph>
  )

  const ImageHeaderPlaceholder = (
    <SemanticPlaceholder.Header image>
      {_times(lines || 1, (num) => (
        <SemanticPlaceholder.Line {...restInnerProps} key={num.toString()} />
      ))}
    </SemanticPlaceholder.Header>
  )

  const ImagePlaceholder = <SemanticPlaceholder.Image {...restInnerProps} />

  const placeholderRepresentation = (type) => {
    switch (type) {
      case PlaceholderType.Paragraph:
        return ParagraphPlaceholder
      case PlaceholderType.ImageHeader:
        return ImageHeaderPlaceholder
      case PlaceholderType.Image:
        return ImagePlaceholder
      default:
        return ParagraphPlaceholder
    }
  }

  return (
    <SemanticPlaceholder {...rest}>
      {placeholderRepresentation(type)}
    </SemanticPlaceholder>
  )
}

export default Placeholder
