import React from 'react'
import { Button as ThemeButton, ButtonProps } from 'theme-ui'

interface CustomButtonProps extends ButtonProps{
  loading?: boolean;
  block?: boolean;
  // children: ReactNode;
}

export default function Button({ loading, children, disabled, block, ...props }: CustomButtonProps) {
  return (
    <ThemeButton
      disabled={loading || disabled}
      css={{
        width: block ? '100%' : 'auto',
        '&hover': {
          cursor: 'pointer',
        }
      }}
      {...props}
    >
      {loading ? (
        <svg className="icon icon-spinner spin">
          <use xlinkHref="#icon-spinner" />
        </svg>
      ) : children}
    </ThemeButton>
  )
}
