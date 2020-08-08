import React from 'react'
import { Box } from 'theme-ui'

export default function Card({ ...props }) {
  return (
    <Box
      mb={3}
      css={{ borderRadius: "0.25rem", border: '1px solid #444' }}
      bg="muted"
      {...props}
    />
  )
}
