import * as reactPlugin from 'vite-plugin-react'
import type { UserConfig } from 'vite'

const config: UserConfig = {
  jsx: 'react',
  plugins: [reactPlugin],
  optimizeDeps: {
    include: ['markdown-it-container', 'moment']
  }
}

export default config
