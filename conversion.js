const CURRENCY_CODES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'MXN', 'CNY', 'INR', 'BRL', 'KRW'
];

const RATE_SNAPSHOT_CODES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'MXN'];
const rateCache = new Map();

function formatCurrencyAmount(value, currencyCode) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2
  }).format(value);
}

function formatRate(rate) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(rate);
}

function renderCurrencyOptions(selectElement, selectedCode) {
  if (!selectElement) {
    return;
  }

  selectElement.innerHTML = '';
  CURRENCY_CODES.forEach((code) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = code;
    if (code === selectedCode) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
}

async function fetchRates(baseCode) {
  if (rateCache.has(baseCode)) {
    return rateCache.get(baseCode);
  }

  const response = await fetch(`https://open.er-api.com/v6/latest/${baseCode}`);
  if (!response.ok) {
    throw new Error('Could not fetch rates');
  }

  const data = await response.json();
  if (!data || data.result !== 'success' || !data.rates) {
    throw new Error('Invalid rates response');
  }

  const parsed = {
    base: data.base_code || baseCode,
    rates: data.rates,
    updatedAt: data.time_last_update_utc || ''
  };

  rateCache.set(baseCode, parsed);
  return parsed;
}

async function convertCurrency() {
  const amountInput = document.getElementById('conversionAmount');
  const fromSelect = document.getElementById('fromCurrency');
  const toSelect = document.getElementById('toCurrency');
  const result = document.getElementById('conversionResult');
  const updatedAt = document.getElementById('conversionUpdatedAt');

  if (!amountInput || !fromSelect || !toSelect || !result || !updatedAt) {
    return;
  }

  const amount = Number.parseFloat(amountInput.value);
  if (Number.isNaN(amount) || amount < 0) {
    result.textContent = 'Enter a valid amount greater than or equal to 0.';
    return;
  }

  const fromCode = fromSelect.value;
  const toCode = toSelect.value;

  try {
    const data = await fetchRates(fromCode);
    const rate = data.rates[toCode];

    if (typeof rate !== 'number') {
      throw new Error('Missing target rate');
    }

    const converted = amount * rate;
    result.textContent = `${formatCurrencyAmount(amount, fromCode)} = ${formatCurrencyAmount(converted, toCode)}`;
    updatedAt.textContent = data.updatedAt ? `Last update: ${new Date(data.updatedAt).toLocaleString()}` : 'Last update: Unknown';
  } catch (error) {
    result.textContent = 'Could not convert right now. Please try again.';
  }
}

async function renderRateSnapshot() {
  const baseSelect = document.getElementById('ratesBaseCurrency');
  const tableBody = document.getElementById('ratesTableBody');

  if (!baseSelect || !tableBody) {
    return;
  }

  tableBody.innerHTML = '<tr><td colspan="2">Loading rates...</td></tr>';

  try {
    const data = await fetchRates(baseSelect.value);
    tableBody.innerHTML = '';

    RATE_SNAPSHOT_CODES.filter((code) => code !== baseSelect.value).forEach((code) => {
      const rate = data.rates[code];
      if (typeof rate !== 'number') {
        return;
      }

      const row = document.createElement('tr');
      const currencyCell = document.createElement('td');
      const rateCell = document.createElement('td');

      currencyCell.textContent = code;
      rateCell.textContent = formatRate(rate);

      row.appendChild(currencyCell);
      row.appendChild(rateCell);
      tableBody.appendChild(row);
    });

    if (!tableBody.children.length) {
      tableBody.innerHTML = '<tr><td colspan="2">No rates available.</td></tr>';
    }
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="2">Could not load rates. Try Refresh Rates.</td></tr>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const fromSelect = document.getElementById('fromCurrency');
  const toSelect = document.getElementById('toCurrency');
  const ratesBaseSelect = document.getElementById('ratesBaseCurrency');
  const convertButton = document.getElementById('convertCurrencyBtn');
  const refreshButton = document.getElementById('refreshRatesBtn');

  renderCurrencyOptions(fromSelect, 'USD');
  renderCurrencyOptions(toSelect, 'EUR');
  renderCurrencyOptions(ratesBaseSelect, 'USD');

  if (convertButton) {
    convertButton.addEventListener('click', convertCurrency);
  }

  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      rateCache.delete(ratesBaseSelect.value);
      renderRateSnapshot();
    });
  }

  if (ratesBaseSelect) {
    ratesBaseSelect.addEventListener('change', renderRateSnapshot);
  }

  convertCurrency();
  renderRateSnapshot();
});
