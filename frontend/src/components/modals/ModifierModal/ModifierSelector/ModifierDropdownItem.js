import React from 'react';
import propTypes from 'prop-types';
import { MenuBook as MenuBookIcon } from '@mui/icons-material';

const ModifierDropdownItem = ({ option }) => {
  return (
    <>
      {option.isExternal && <MenuBookIcon fontSize="small" style={{ marginRight: '5px' }} />}
      {option.label}
    </>
  );
};

ModifierDropdownItem.propTypes = {
  option: propTypes.object.isRequired
};

export default ModifierDropdownItem;
