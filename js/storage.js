const STORAGE_KEY = 'puppetSoccer';

const DEFAULT_DATA = {
  coins: 0,
  unlockedChars: {},  // { 'arg_0': true, 'arg_1': false, ... }
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return { ...DEFAULT_DATA, ...data };
    }
  } catch (e) {
    console.warn('Failed to load save data:', e);
  }
  return { ...DEFAULT_DATA, unlockedChars: {} };
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save data:', e);
  }
}

export function isCharUnlocked(data, charId) {
  return data.unlockedChars[charId] === true;
}

export function unlockChar(data, charId) {
  data.unlockedChars[charId] = true;
  saveData(data);
}

export function addCoins(data, amount) {
  data.coins += amount;
  saveData(data);
}

export function spendCoins(data, amount) {
  if (data.coins >= amount) {
    data.coins -= amount;
    saveData(data);
    return true;
  }
  return false;
}
