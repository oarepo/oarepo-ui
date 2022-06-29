// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { useComponent } from 'react-generative-ui'

// async function getComponent(componentId) {
//   const component = await import(
//     /* webpackInclude: /\.jsx$/ */ `./components/${componentId}.jsx`
//   )
//   return component
// }
// eslint-disable-next-line react-hooks/rules-of-hooks
console.log(useComponent('Span'))
