const assert = require('node:assert/strict');
const Login = require('../lib/login');

function response({ status = 302, location, setCookies = [], body = '' } = {}) {
  const headers = new Headers();
  if (location) headers.set('location', location);
  for (const cookie of setCookies) headers.append('set-cookie', cookie);
  return new Response(body, { status, headers });
}

async function main() {
  const requests = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    if (requests.length === 1) return response({ status: 302, location: 'https://agent.teleai.com.cn/step-2', setCookies: ['step=two; Path=/'] });
    return response({ status: 200, setCookies: ['operationToken=jwt-from-final; Path=/'] });
  };
  try {
    const login = new Login('/tmp/xingchen-cookie-test', { info() {} });
    const token = await login.followRedirectForToken('https://agent.teleai.com.cn/step-1', { operToken: 'website-session' });
    assert.equal(token, 'jwt-from-final');
    assert.match(requests[0].options.headers.Cookie, /operToken=website-session/);
    assert.match(requests[1].options.headers.Cookie, /operToken=website-session/);
    assert.match(requests[1].options.headers.Cookie, /step=two/);
  } finally {
    global.fetch = originalFetch;
  }
}

main().then(() => console.log('login cookie propagation test passed'));
