const axios = require('axios');
const logger = require('../config/logger');

const CHAPA_BASE = 'https://api.chapa.co/v1';
const BANK_CACHE_TTL = 10 * 60 * 1000;

let bankCache = { at: 0, data: [] };

const KNOWN_BANK_CODES = {
  telebirr: '853d0598-9c01-41ab-ac99-48eab4da1513',
  cbe_birr: '96e41186-29ba-4e30-b013-2ca36d7e7025',
  cbe: '96e41186-29ba-4e30-b013-2ca36d7e7025'
};

function chapaHeaders() {
  return {
    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
    'Content-Type': 'application/json'
  };
}

async function listBanks(force = false) {
  if (!force && bankCache.data.length && Date.now() - bankCache.at < BANK_CACHE_TTL) {
    return bankCache.data;
  }
  try {
    const res = await axios.get(`${CHAPA_BASE}/banks`, { headers: chapaHeaders() });
    bankCache = { at: Date.now(), data: res.data?.data || [] };
    return bankCache.data;
  } catch (error) {
    logger.error('Chapa listBanks error', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return bankCache.data;
  }
}

async function resolveBankCode(method, accountDetails = {}) {
  if (accountDetails.bankCode) return accountDetails.bankCode;

  const key = method.toLowerCase().replace(/_/g, '');
  if (KNOWN_BANK_CODES[key]) return KNOWN_BANK_CODES[key];

  const banks = await listBanks();
  const match = banks.find((b) => {
    const name = (b.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      (key === 'telebirr' && name.includes('telebirr')) ||
      (key === 'cbebirr' && name.includes('commercialbankofethiopia')) ||
      name.includes(key)
    );
  });
  return match ? match.id : null;
}

async function initiateTransfer({ accountName, accountNumber, amount, bankCode, reference }) {
  const payload = {
    account_name: accountName,
    account_number: accountNumber,
    amount: String(amount),
    currency: 'ETB',
    bank_code: bankCode,
    reference
  };
  try {
    const res = await axios.post(`${CHAPA_BASE}/transfers`, payload, { headers: chapaHeaders() });
    return res.data;
  } catch (error) {
    logger.error('Chapa transfer error', {
      reference,
      status: error.response?.status,
      message: error.response?.data?.message || error.response?.data?.error || error.message
    });
    return {
      status: 'failed',
      error: error.response?.data?.message || error.response?.data?.error || error.message
    };
  }
}

async function verifyTransfer(reference) {
  try {
    const res = await axios.get(`${CHAPA_BASE}/transfers/verify/${encodeURIComponent(reference)}`, {
      headers: chapaHeaders()
    });
    return res.data;
  } catch (error) {
    logger.error('Chapa transfer verify error', {
      reference,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return { status: 'failed', error: error.response?.data?.message || error.message };
  }
}

function normalizeEthiopianPhone(phone) {
  if (!phone) return phone;
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (!p.startsWith('251')) p = `251${p}`;
  return p;
}

module.exports = { listBanks, resolveBankCode, initiateTransfer, verifyTransfer, normalizeEthiopianPhone, KNOWN_BANK_CODES };