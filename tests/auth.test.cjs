const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    exports, require(name) {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected import ${name}`);
    },
    console, URL, AbortSignal, AbortController, setTimeout, clearTimeout,
    process: { env: { NEXT_PUBLIC_API_URL: 'https://strapi.test/' } },
    ...globals,
  }, { filename: file });
  return exports;
}

const roles = load('src/app/utils/lib/context/laboratory-role.ts');

test('laboratory roles use names/types instead of database IDs and deny unknown roles', () => {
  for (const role of [{ id: 7, type: 'laboratory' }, { id: 11, name: 'Laboratoire' }, { name: ' LABO ' }]) {
    assert.equal(roles.isLaboratoryRole(role), true);
  }
  for (const role of [null, {}, { id: 3 }, { id: 3, type: 'authenticated' }, { type: 'super-admin' }]) {
    assert.equal(roles.isLaboratoryRole(role), false);
  }
});

test('middleware redirects visitors and clients and allows laboratories on every subpage', async () => {
  let token;
  const { middleware, config } = load('src/middleware.ts', {
    'next-auth/jwt': { getToken: async () => token },
    'next/server': { NextResponse: { next: () => ({ next: true }), redirect: url => ({ location: url.pathname }) } },
    './app/utils/lib/context/laboratory-role': roles,
  });
  assert.ok(config.matcher.includes('/admin/laboratory/:path*'));
  for (const route of ['/admin/laboratory', '/admin/laboratory/managing-orders', '/admin/laboratory/managing-stock-products', '/admin/laboratory/settings', '/admin/laboratory/new/subpage']) {
    for (token of [null, { role: { type: 'authenticated', id: 3 } }]) {
      assert.equal((await middleware({ url: 'https://dashboard.test' + route, nextUrl: { pathname: route } })).location, '/');
    }
    token = { role: { type: 'laboratory', id: 7 } };
    assert.equal((await middleware({ url: 'https://dashboard.test' + route, nextUrl: { pathname: route } })).next, true);
  }
  assert.equal((await middleware({ url: 'https://dashboard.test/', nextUrl: { pathname: '/' } })).location, '/admin/laboratory');
});

function loginWith(fetch, env) {
  return load('src/app/utils/lib/api/users/api-requests.tsx', {}, { fetch, ...(env ? { process: { env } } : {}) }).loginLib;
}
const credentials = { identifier: 'lab@example.com', password: 'test-only-password' };
const authData = { jwt: 'test-jwt', user: { id: 42, email: credentials.identifier, role: { id: 7, type: 'laboratory' }, laboratories: [{ id: 5 }] } };

test('login sends JSON credentials and bypasses caching', async () => {
  const login = loginWith(async (url, options) => {
    assert.equal(url, 'https://strapi.test/api/auth/local');
    assert.equal(options.method, 'POST');
    assert.equal(options.cache, 'no-store');
    assert.deepEqual(JSON.parse(options.body), credentials);
    return { ok: true, status: 200, json: async () => authData };
  });
  assert.equal((await login(credentials)).jwt, 'test-jwt');
});

test('invalid credentials are distinct from unavailable servers and malformed responses', async () => {
  for (const status of [400, 401, 403]) {
    assert.equal(await loginWith(async () => ({ status, ok: false }))(credentials), null);
  }
  await assert.rejects(loginWith(async () => { throw new Error('offline'); })(credentials), /AuthUnavailable/);
  await assert.rejects(loginWith(async () => ({ ok: false, status: 500 }))(credentials), /AuthUnavailable/);
  await assert.rejects(loginWith(async () => ({ ok: true, status: 200, json: async () => { throw new Error('not JSON'); } }))(credentials), /AuthUnavailable/);
  await assert.rejects(loginWith(async () => ({ ok: true, status: 200, json: async () => ({}) }))(credentials), /AuthInvalidResponse/);
  await assert.rejects(loginWith(async () => {}, {})(credentials), /AuthConfiguration/);
});

test('authorization denies ordinary users and preserves the laboratory session', async () => {
  let response = authData;
  const { authOptions } = load('src/app/utils/lib/context/authOptions.ts', {
    'next-auth/providers/credentials': { default: value => value },
    '../api/users/api-requests': { loginLib: async params => {
      assert.equal(params.identifier, 'lab@example.com');
      return response;
    } },
    './laboratory-role': roles,
  });
  const authorize = authOptions.providers[0].authorize;
  const user = await authorize({ email: ' lab@example.com ', password: 'test' });
  const token = await authOptions.callbacks.jwt({ token: {}, user });
  const session = await authOptions.callbacks.session({ session: { user: {} }, token });
  assert.equal(session.user.jwt, 'test-jwt');
  assert.equal(session.user.role.id, 7);
  assert.equal(session.user.laboratory[0].id, 5);
  response = null;
  assert.equal(await authorize({ email: 'lab@example.com', password: 'bad' }), null);
  response = { ...authData, user: { ...authData.user, role: { id: 3, type: 'authenticated' } } };
  await assert.rejects(authorize({ email: 'lab@example.com', password: 'test' }), /LaboratoryAccessDenied/);
  assert.equal(await authorize(undefined), null);
});

test('session checks retain sessions on network errors or 403 and sign out on 401 only', async () => {
  for (const status of [200, 401, 403, 500, 'offline']) {
    let signedOut = 0;
    let message;
    let cleanup;
    let state = 0;
    const react = {
      createContext: () => ({ Provider: () => null }), useContext: () => ({}),
      useState: initial => { const index = state++; return [initial, value => { if (index === 0) message = value; }]; },
      useEffect: fn => { cleanup = fn(); },
    };
    const { SessionUserProvider } = load('src/app/utils/lib/context/session/check-session.tsx', {
      react,
      'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
      'next-auth/react': { useSession: () => ({ data: { user: { jwt: 'test-jwt' } } }), signOut: () => { signedOut++; } },
    }, { fetch: async () => {
      if (status === 'offline') throw new Error('offline');
      return { status, ok: status === 200 };
    } });
    SessionUserProvider({ children: null });
    await new Promise(resolve => setImmediate(resolve));
    cleanup();
    assert.equal(signedOut, status === 401 ? 1 : 0);
    assert.equal(Boolean(message), status !== 200 && status !== 401);
  }
});

test('page data errors distinguish expired sessions, forbidden data and network outages', async () => {
  for (const status of [401, 403, 500, 'offline', 'invalid']) {
    const { fetchDashboardData } = load('src/app/utils/lib/api/dashboard-data.ts', {}, { fetch: async () => {
      if (status === 'offline') throw new Error('offline');
      return { status: status === 'invalid' ? 200 : status, ok: status === 'invalid', json: async () => { throw new Error('invalid'); } };
    } });
    await assert.rejects(fetchDashboardData('/api/orders/laboratory', 'test-jwt'), error => {
      assert.ok(error.message);
      if (status === 401 || status === 403) assert.equal(error.status, status);
      return true;
    });
    await assert.rejects(fetchDashboardData('/api/orders/laboratory'), error => error.status === 401);
  }
});

test('login form navigates immediately on success and releases loading after every failure', async () => {
  for (const outcome of ['success', 'credentials', 'unavailable', 'offline', 'undefined']) {
    let form;
    let state = 0;
    const updates = [];
    const destinations = [];
    const messages = [];
    const schema = { email() { return this; }, required() { return this; } };
    const { default: LoginForm } = load('src/components/forms/users/LoginForm.tsx', {
      react: { default: {}, useState: initial => { const index = state++; return [initial, value => updates.push({ index, value })]; } },
      'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
      'react-icons/fa': {},
      formik: { useFormik: options => { form = options; return { values: options.initialValues, errors: {}, touched: {} }; } },
      yup: { string: () => schema, object: () => ({}) },
      'react-toastify': { toast: { error: message => messages.push(message) } },
      'react-toastify/dist/ReactToastify.css': {},
      'next/link': { default: () => null },
      'next/image': { default: () => null },
      '../../../../public/logo.png': {},
      'next/navigation': { useRouter: () => ({ replace: value => destinations.push(value), refresh() {} }) },
      'next-auth/react': { signIn: async () => {
        if (outcome === 'offline') throw new Error('Failed to fetch');
        if (outcome === 'undefined') return undefined;
        return { ok: outcome === 'success', error: outcome === 'credentials' ? 'CredentialsSignin' : outcome === 'unavailable' ? 'AuthUnavailable' : null };
      } },
    });
    LoginForm();
    await form.onSubmit({ email: 'lab@example.com', password: 'test' });
    assert.equal(updates.filter(item => item.index === 2).at(-1).value, false);
    if (outcome === 'success') {
      assert.deepEqual(destinations, ['/admin/laboratory']);
      assert.equal(messages.length, 0);
    } else {
      assert.equal(destinations.length, 0);
      assert.equal(messages.length, 1);
      if (outcome === 'offline') assert.ok(messages[0].includes('Impossible de joindre'));
    }
  }
});

test('public promotion requests keep their existing anonymous access', async () => {
  const { fetchDashboardData } = load('src/app/utils/lib/api/dashboard-data.ts', {}, { fetch: async (url, options) => {
    assert.equal(url, 'https://strapi.test/api/promotions?populate=*');
    assert.equal(options.headers.Authorization, undefined);
    return { ok: true, status: 200, json: async () => ({ data: [] }) };
  } });
  assert.equal((await fetchDashboardData('/api/promotions?populate=*', undefined, { anonymous: true })).data.length, 0);
});
