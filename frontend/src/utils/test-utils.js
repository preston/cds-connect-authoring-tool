import React from 'react';
import { Provider } from 'react-redux';
import { render as testingLibRender } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { HelmetProvider } from 'react-helmet-async';
import { act, screen, fireEvent } from '@testing-library/react';

import configureStore from '../store/configureStore';
import lightTheme from 'styles/theme';

const ProviderWrapper = ({ children, pathname }) => (
  <MemoryRouter initialEntries={pathname ? [pathname] : undefined}>
    <Provider store={configureStore()}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <QueryClientProvider client={new QueryClient()}>
          <StyledEngineProvider injectFirst>
            <ThemeProvider theme={lightTheme}>
              <HelmetProvider>{children}</HelmetProvider>
            </ThemeProvider>
          </StyledEngineProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </Provider>
  </MemoryRouter>
);

export const render = (ui, options = {}) => {
  const { pathname, ...restOptions } = options;
  return testingLibRender(ui, {
    wrapper: props => <ProviderWrapper {...props} pathname={pathname} />,
    ...restOptions
  });
};

export const changeDate = async (value, index = 0) => {
  await act(async () => {
    fireEvent.change(screen.getAllByPlaceholderText(/mm\/dd\/yyyy/i)[index], { target: { value } });
  });
};

export const changeTime = async (value, index = 0) => {
  await act(async () => {
    fireEvent.change(screen.getAllByPlaceholderText(/hh:mm:ss/i)[index], { target: { value } });
  });
};

export { getRoles, logRoles } from '@testing-library/dom';
export { act, fireEvent, waitFor, waitForElementToBeRemoved, prettyDOM, screen, within } from '@testing-library/react';
export { default as userEvent, PointerEventsCheckLevel } from '@testing-library/user-event';
