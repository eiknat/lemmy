import * as reactPlugin from 'vite-plugin-react'
import type { UserConfig } from 'vite'

const config: UserConfig = {
  jsx: 'react',
  plugins: [reactPlugin],
  optimizeDeps: {
    include: [
      'markdown-it-container',
      'moment',
      'markdown-it-emoji',
      "markdown-it-emoji/light",
      "moment/locale/es",
      "moment/locale/el",
      "moment/locale/eu",
      "moment/locale/eo",
      "moment/locale/de",
      "moment/locale/zh-cn",
      "moment/locale/fr",
      "moment/locale/sv",
      "moment/locale/ru",
      "moment/locale/nl",
      "moment/locale/it",
      "moment/locale/fi",
      "moment/locale/ca",
      "moment/locale/fa",
      "moment/locale/pl",
      "moment/locale/pt-br",
      "moment/locale/ja",
      "moment/locale/ka",
      "moment/locale/hi",
      "moment/locale/gl",
      "moment/locale/tr",
      "moment/locale/hu",
      "moment/locale/uk",
      "moment/locale/sq",
      "moment/locale/km",
      "moment/locale/ga",
      "moment/locale/sr",
    ]
  }
}

export default config
