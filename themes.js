/* ════════════════════════════════════════
   PACK THEMES
   ════════════════════════════════════════ */

const PACK_THEMES = {

  generic: {
    image: './pictures/default.png',
    glow: '#7eb8f7',
    label: 'COMMAND COLLECTION'
  },

  mysql: {
    image: './pictures/default.png',
    glow: '#00758f',
    label: 'MYSQL BOOSTER PACK'
  },

  redis: {
    image: './pictures/default.png',
    glow: '#dc382d',
    label: 'REDIS BOOSTER PACK'
  },

  devops: {
    image: 'pictures/default.png',
    glow: '#4caf50',
    label: 'DEVOPS BOOSTER PACK'
  },

  network: {
    image: 'pictures/default.png',
    glow: '#2196f3',
    label: 'NETWORK BOOSTER PACK'
  },

  support: {
    image: 'pictures/default.png',
    glow: '#ff9800',
    label: 'SUPPORT BOOSTER PACK'
  },

  linux: {
    image: 'pictures/default.png',
    glow: '#f5c542',
    label: 'LINUX BOOSTER PACK'
  },

  windows: {
    image: 'pictures/default.png',
    glow: '#00adef',
    label: 'WINDOWS BOOSTER PACK'
  },

  powershell: {
    image: 'pictures/default.png',
    glow: '#5391fe',
    label: 'POWERSHELL BOOSTER PACK'
  },

  security: {
    image: 'pictures/default.png',
    glow: '#ff4444',
    label: 'SECURITY BOOSTER PACK'
  },

  active_directory: {
    image: 'pictures/default.png',
    glow: '#3f7ae0',
    label: 'ACTIVE DIRECTORY BOOSTER PACK'
  },

  cloud: {
    image: 'pictures/default.png',
    glow: '#8e7dff',
    label: 'CLOUD BOOSTER PACK'
  },

  aws: {
    image: 'pictures/default.png',
    glow: '#ff9900',
    label: 'AWS BOOSTER PACK'
  },

  azure: {
    image: 'pictures/default.png',
    glow: '#0089d6',
    label: 'AZURE BOOSTER PACK'
  },

  kubernetes: {
    image: 'pictures/default.png',
    glow: '#326ce5',
    label: 'KUBERNETES BOOSTER PACK'
  },

  docker: {
    image: 'pictures/default.png',
    glow: '#2496ed',
    label: 'DOCKER BOOSTER PACK'
  }
};

/* ════════════════════════════════════════
   DETECT PACK THEME
   ════════════════════════════════════════ */

function detectPackTheme(deckName = '') {

  const name = deckName.toLowerCase();

  if (
    name.includes('mysql') ||
    name.includes('mariadb')
  ) return 'mysql';

  if (
    name.includes('redis')
  ) return 'redis';

  if (
    name.includes('docker')
  ) return 'docker';

  if (
    name.includes('kubernetes') ||
    name.includes('k8s')
  ) return 'kubernetes';

  if (
    name.includes('devops') ||
    name.includes('cicd') ||
    name.includes('jenkins') ||
    name.includes('gitlab')
  ) return 'devops';

  if (
    name.includes('network') ||
    name.includes('switch') ||
    name.includes('router') ||
    name.includes('cisco')
  ) return 'network';

  if (
    name.includes('support') ||
    name.includes('helpdesk') ||
    name.includes('ticket')
  ) return 'support';

  if (
    name.includes('linux') ||
    name.includes('ubuntu') ||
    name.includes('debian') ||
    name.includes('centos') ||
    name.includes('rhel')
  ) return 'linux';

  if (
    name.includes('windows')
  ) return 'windows';

  if (
    name.includes('powershell')
  ) return 'powershell';

  if (
    name.includes('security') ||
    name.includes('red team') ||
    name.includes('blue team') ||
    name.includes('pentest')
  ) return 'security';

  if (
    name.includes('active directory') ||
    name.includes('ad')
  ) return 'active_directory';

  if (
    name.includes('cloud')
  ) return 'cloud';

  if (
    name.includes('aws')
  ) return 'aws';

  if (
    name.includes('azure')
  ) return 'azure';

  return 'generic';
}

function getPackTheme(deckName = '') {

  const themeKey =
    detectPackTheme(deckName);

  return (
    PACK_THEMES[themeKey] ||
    PACK_THEMES.generic
  );
}