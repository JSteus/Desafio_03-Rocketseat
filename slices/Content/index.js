import React from 'react'
import { RichText } from 'prismic-reactjs'

const Content = ({ slice }) => (
  <section>
   <span >{ slice.primary.heading }</span>
   <RichText render={slice.primary.body} />
  </section>
)

export default Content