import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { CircularProgress } from '@mui/material';

import { ErrorPage } from 'components/base';

const PrivateRoute = ({ component: Component }) => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const isAuthenticating = useSelector(state => state.auth.isAuthenticating);

  if (isAuthenticating) {
    return <CircularProgress />;
  }

  if (!isAuthenticated) {
    return <ErrorPage errorType="notLoggedIn" />;
  }

  return <Component />;
};

PrivateRoute.propTypes = {
  component: PropTypes.elementType.isRequired
};

export default PrivateRoute;
