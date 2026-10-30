const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const laboratories = [
  { id: 10, name: 'Labo A' },
  { id: 20, name: 'Labo B' },
];
const orders = laboratories.map(laboratory => ({
  order_id: 42,
  laboratory,
  date: '2026-10-01T12:00:00Z',
  products: [],
  invoices: {
    vendor_to_customer: { invoice_number: `INV-${laboratory.id}`, pdf_url: `/invoices/${laboratory.id}.pdf` },
    platform_commission: { invoice_number: `COMM-${laboratory.id}`, pdf_url: `/invoices/commission-${laboratory.id}.pdf` },
  },
}));

function view(data) {
  const state = [];
  let cursor = 0;
  let exportedRows;
  const exports = {};
  const dependencies = {
    react: {
      ...React,
      useMemo: fn => fn(),
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], value => { state[index] = value; }];
      },
    },
    'react/jsx-runtime': require('react/jsx-runtime'),
    xlsx: { utils: {
      json_to_sheet: rows => { exportedRows = rows; return {}; },
      book_new: () => ({}), book_append_sheet() {},
    }, writeFile() {} },
    jszip: { default: function JSZip() {} },
    'file-saver': { saveAs() {} },
  };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/pages/laboratories/LaboratoryInvoicesClient.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    exports, require: name => dependencies[name],
    process: { env: { NEXT_PUBLIC_API_URL: 'https://api.test' } },
  });
  return {
    render() { cursor = 0; return exports.default({ data }); },
    rows: () => exportedRows,
  };
}

function elements(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => elements(child, predicate));
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...elements(node.props.children, predicate)];
}

test('the invoice page displays both laboratories and both PDF pairs for a shared order', () => {
  const page = view({ laboratories, orders });
  const tree = page.render();
  const markup = renderToStaticMarkup(tree);
  for (const lab of laboratories) assert.ok(markup.includes(lab.name));
  assert.ok(markup.includes('1 commande affichée'));
  assert.equal(elements(tree, node => node.type === 'a').length, 4);
  const keys = elements(tree, node => node.type === 'div' && node.key !== null).map(node => node.key);
  assert.deepEqual(keys, ['42:10', '42:20']);
});

test('opening details for one laboratory does not open the other laboratory on the same order', () => {
  const page = view({ laboratories, orders });
  let tree = page.render();
  elements(tree, node => node.type === 'button' && node.props.children === 'Voir le détail')[0].props.onClick();
  tree = page.render();
  let markup = renderToStaticMarkup(tree);
  assert.ok(markup.includes('INV-10'));
  assert.ok(!markup.includes('INV-20'));
  elements(tree, node => node.type === 'button' && node.props.children === 'Voir le détail')[0].props.onClick();
  markup = renderToStaticMarkup(page.render());
  assert.ok(!markup.includes('INV-10'));
  assert.ok(markup.includes('INV-20'));
});

test('search can select a laboratory and Excel exports retain both laboratories invoices', () => {
  const page = view({ laboratories, orders });
  let tree = page.render();
  elements(tree, node => node.type === 'button' && node.props.children === 'Exporter en Excel')[0].props.onClick();
  assert.deepEqual(Array.from(page.rows(), row => row['Facture client']), ['INV-10', 'INV-20']);
  elements(tree, node => node.type === 'input' && node.props.type === 'text')[0].props.onChange({ target: { value: 'Labo B' } });
  tree = page.render();
  const links = elements(tree, node => node.type === 'a');
  assert.equal(links.length, 2);
  assert.ok(links.every(link => link.props.href.includes('20')));
});

test('the page remains compatible with the single-laboratory response', () => {
  const page = view({ laboratory: laboratories[0], orders: [{ ...orders[0], laboratory: undefined }] });
  const markup = renderToStaticMarkup(page.render());
  assert.ok(markup.includes('Labo A'));
  assert.ok(markup.includes('1 commande affichée'));
  assert.equal(elements(page.render(), node => node.type === 'a').length, 2);
});

test('the laboratory selector filters invoices, totals and exports and can return to all laboratories', () => {
  const page = view({
    laboratories,
    orders: orders.map((order, index) => ({
      ...order,
      amounts: { gross_amount: (index + 1) * 1000, commission_amount: (index + 1) * 100, net_transferred_amount: (index + 1) * 900 },
    })),
    summary: { orders_count: 1, gross_amount: 3000, commission_amount: 300, net_transferred_amount: 2700 },
  });
  let tree = page.render();
  const options = elements(tree, node => node.type === 'option');
  assert.deepEqual(options.map(option => [option.props.value, option.props.children]), [
    ['', 'Tous les laboratoires'], ['10', 'Labo A'], ['20', 'Labo B'],
  ]);
  assert.equal(elements(tree, node => node.type === 'select')[0].props.value, '');

  for (const id of ['10', '20']) {
    elements(tree, node => node.type === 'select')[0].props.onChange({ target: { value: id } });
    tree = page.render();
    const links = elements(tree, node => node.type === 'a');
    assert.equal(links.length, 2);
    assert.ok(links.every(link => link.props.href.includes(id)));
    const formatMoney = value => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
    const amount = Number(id);
    const markup = renderToStaticMarkup(tree);
    for (const total of [amount, amount / 10, amount * 0.9]) assert.ok(markup.includes(formatMoney(total)));
    elements(tree, node => node.type === 'button' && node.props.children === 'Exporter en Excel')[0].props.onClick();
    assert.deepEqual(Array.from(page.rows(), row => row['Facture client']), [`INV-${id}`]);
  }

  elements(tree, node => node.type === 'select')[0].props.onChange({ target: { value: '' } });
  tree = page.render();
  assert.equal(elements(tree, node => node.type === 'a').length, 4);
  elements(tree, node => node.type === 'select')[0].props.onChange({ target: { value: '10' } });
  tree = page.render();
  elements(tree, node => node.type === 'button' && node.props.children === 'Réinitialiser les filtres')[0].props.onClick();
  tree = page.render();
  assert.equal(elements(tree, node => node.type === 'select')[0].props.value, '');
  assert.equal(elements(tree, node => node.type === 'a').length, 4);
});
