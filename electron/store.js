const GENRES = [
  'Politics',
  'Business',
  'Technology',
  'Science',
  'Sports',
  'Entertainment',
  'Crime',
  'Health',
  'World',
  'Environment',
];

const schema = {
  enabledGenres: {
    type: 'array',
    items: { type: 'string' },
    default: GENRES,
  },
  refreshInterval: {
    type: 'number',
    default: 600000, // 10 minutes
    minimum: 60000,
  },
};

let store = null;

async function initStore() {
  // electron-store v11 is ESM-only, use dynamic import
  const { default: ElectronStore } = await import('electron-store');
  store = new ElectronStore({ schema });
}

function getStore() {
  return store;
}

module.exports = { initStore, getStore, GENRES };
