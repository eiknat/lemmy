const host = `${window.location.hostname}`;
const port = `${
  window.location.port == '4444' ? '8536' : window.location.port
}`;
const endpoint = `${host}:${port}`;

// for testing against prod endpoint
// const endpoint = 'www.chapo.chat';

export const wsUri = `${
  window.location.protocol == 'https:' ? 'wss://' : 'ws://'
}${endpoint}/api/v1/ws`;

export const HCAPTCHA_SITE_KEY = '10000000-ffff-ffff-ffff-000000000001';
