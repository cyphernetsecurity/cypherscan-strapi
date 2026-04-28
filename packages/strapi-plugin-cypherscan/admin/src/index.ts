import React from 'react';

const pluginId = 'cypherscan';

const PluginIcon = () => React.createElement('span', null, 'C');

const buttonStyle = {
  marginRight: 10,
  padding: '8px 12px',
  background: '#2563eb',
  color: '#ffffff',
  border: '1px solid #2563eb',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
};

const HomePage = () => {
  return React.createElement(
    'div',
    { style: { padding: 24 } },

    React.createElement('h1', null, 'CypherScan'),

    React.createElement(
      'p',
      null,
      'Scan Strapi uploads for malware, exposed secrets, and risky payloads before they reach production.'
    ),

    React.createElement('h3', { style: { marginTop: 20 } }, 'Quick start'),

    React.createElement(
      'ol',
      null,
      React.createElement('li', null, 'Get your CypherScan API key'),
      React.createElement('li', null, 'Add CYPHERSCAN_API_KEY in your environment'),
      React.createElement('li', null, 'Upload a test file in Media Library'),
      React.createElement('li', null, 'Check results in Content Manager')
    ),

    React.createElement(
      'div',
      { style: { marginTop: 20 } },

      React.createElement(
        'a',
        {
          href: 'https://cyphernetsecurity.com/dashboard/api-keys',
          target: '_blank',
          rel: 'noopener noreferrer',
          style: { textDecoration: 'none' },
        },
        React.createElement('button', { type: 'button', style: buttonStyle }, 'Get API key')
      ),

      React.createElement(
        'a',
        {
          href: '/admin/plugins/upload',
          style: { textDecoration: 'none' },
        },
        React.createElement('button', { type: 'button', style: buttonStyle }, 'Open Media Library')
      ),

      React.createElement(
        'a',
        {
          href: '/admin/content-manager/collection-types/api::cypherscan-scan-result.cypherscan-scan-result',
          style: { textDecoration: 'none' },
        },
        React.createElement('button', { type: 'button', style: buttonStyle }, 'View scan results')
      )
    )
  );
};

export default {
  register(app: any) {
    app.addMenuLink({
      to: `plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'CypherScan',
      },
      Component: async () => HomePage,
      permissions: [],
    });

    app.registerPlugin({
      id: pluginId,
      name: 'CypherScan',
    });
  },

  bootstrap() {},

  async registerTrads() {
    return [];
  },
};