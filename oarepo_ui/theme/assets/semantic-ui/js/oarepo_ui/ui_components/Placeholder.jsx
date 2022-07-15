// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import Overridable from 'react-overridable'
import PropTypes from 'prop-types'
import { Placeholder as SemanticPlaceholder } from 'semantic-ui-react'
import _times from 'lodash/times'
import { buildUID } from '../util'

const PlaceholderType = {
  Paragraph: 'paragraph',
  ImageHeader: 'image-header',
  Image: 'image',
}

/**
 * A placeholder used to reserve space for content that soon will appear in a layout.
 */
const Placeholder = ({
  className,
  style,
  type = 'paragraph',
  lines = 1,
  ...rest
}) => {
  const ParagraphPlaceholder = (
    <SemanticPlaceholder.Paragraph>
      {_times(lines || 1, (num) => (
        <SemanticPlaceholder.Line key={num.toString()} />
      ))}
    </SemanticPlaceholder.Paragraph>
  )

  const ImageHeaderPlaceholder = (
    <SemanticPlaceholder.Header image>
      {_times(lines || 1, (num) => (
        <SemanticPlaceholder.Line key={num.toString()} />
      ))}
    </SemanticPlaceholder.Header>
  )

  const ImagePlaceholder = <SemanticPlaceholder.Image />

  const placeholderRepresentation = (placeholderType) => {
    switch (placeholderType) {
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
    <Overridable id={buildUID('Placeholder', '', 'oarepo_ui')}>
      <SemanticPlaceholder
        className={clsx('oarepo', 'oarepo-placeholder', className)}
        style={style}
        {...rest}
      >
        {placeholderRepresentation(type)}
      </SemanticPlaceholder>
    </Overridable>
  )
}

Placeholder.propTypes = {
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  type: PropTypes.oneOf([
    PlaceholderType.Paragraph,
    PlaceholderType.ImageHeader,
    PlaceholderType.Image,
  ]),
}

export default Overridable.component('Placeholder', Placeholder)
