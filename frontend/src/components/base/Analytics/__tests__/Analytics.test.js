import React from 'react';
import { render, waitFor } from 'utils/test-utils';
import { Analytics } from 'components/base';

describe('<Analytics />', () => {
  const renderComponent = (props = {}) =>
    render(<Analytics gtmKey="TEST-GTM-KEY" dapURL="http://example.org/dap" {...props} />);

  // Clean up script tags between tests
  afterEach(() => {
    // Remove any script tags that might be left over from previous tests
    const scripts = document.head.querySelectorAll('script');
    scripts.forEach(script => script.remove());
  });

  it('renders a noscript tag when GTM/DAP is configured', () => {
    const { container } = renderComponent();
    const noscript = container.querySelector('noscript');

    expect(noscript).not.toBeNull();
  });

  it('renders GTM and DAP script tags in HEAD when GTM/DAP is configured', async () => {
    renderComponent();

    await waitFor(() => {
      // Only check script tags created by react-helmet-async
      const reactHelmetScripts = document.head.querySelectorAll('script[data-rh="true"]');
      expect(reactHelmetScripts).toHaveLength(2);

      // First check inlined GTM script
      const inlineGtmScript = Array.from(reactHelmetScripts).find(
        script => script.innerHTML && script.innerHTML.includes('TEST-GTM-KEY')
      );
      expect(inlineGtmScript).toBeDefined();

      // Then check DAP script
      const dapScript = Array.from(reactHelmetScripts).find(script => script.src === 'http://example.org/dap');
      expect(dapScript).toBeDefined();
    });
  });

  it('does not render GTM iframe when GTM/DAP is not configured', () => {
    const { container } = renderComponent({ gtmKey: null, dapURL: null });

    expect(container).toBeEmptyDOMElement();
  });

  it('does not render GTM and DAP script tags in HEAD when GTM/DAP is not configured', async () => {
    renderComponent({ gtmKey: null, dapURL: null });

    await waitFor(() => {
      const reactHelmetScripts = document.head.querySelectorAll('script[data-rh="true"]');
      expect(reactHelmetScripts).toHaveLength(0);
    });
  });
});
