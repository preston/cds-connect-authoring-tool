import React from 'react';

import ErrorPage from '../ErrorPage';
import { render, screen } from 'utils/test-utils';

describe('<ErrorPage />', () => {
  const renderComponent = ({ pathname = '/', ...props } = {}) => render(<ErrorPage {...props} />, { pathname });

  it('renders a generic message when errorType is not provided', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: 'An error has occurred.' })).toBeInTheDocument();
  });

  it('renders a not found message with the intended location', () => {
    renderComponent({
      errorType: 'notFound',
      pathname: '/fake-path'
    });

    expect(screen.getByRole('heading', { name: 'No match for /fake-path .' })).toBeInTheDocument();
  });

  it('renders a must be logged in message with the intended location', () => {
    renderComponent({
      errorType: 'notLoggedIn',
      pathname: '/artifacts'
    });

    expect(
      screen.getByRole('heading', { name: 'Unable to reach /artifacts . You may need to log in to access.' })
    ).toBeInTheDocument();
  });
});
