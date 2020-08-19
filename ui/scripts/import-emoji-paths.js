const { readdirSync, writeFileSync } = require('fs');
const { resolve } = require('path');

// automatically read all file paths from emojis and export to json
const files = readdirSync(resolve('.', 'public', 'emojis'))

writeFileSync('./src/emoji-paths.json', JSON.stringify(files), 'utf8');