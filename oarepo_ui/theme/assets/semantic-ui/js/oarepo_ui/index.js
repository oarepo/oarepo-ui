// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

async function getComponent(componentId) {
  const component = await import(
    /* webpackInclude: /\.jsx$/ */ `./components/${componentId}.jsx`
  )
  return component
}

console.log(getComponent('Span'))
