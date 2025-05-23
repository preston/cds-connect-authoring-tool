import React, { memo, useMemo } from 'react';
import { FastField, useFormikContext } from 'formik';
import { TextField as MuiTextField } from '@mui/material';
import clsx from 'clsx';

import { isCpgComplete } from 'utils/fields';
import { useFieldStyles } from 'styles/hooks';
import useStyles from './styles';

let labelUuid = 0;

const MuiFastField = ({ field: { name, value, onChange, onBlur }, form: { touched, errors }, ...props }) => (
  <MuiTextField
    error={touched[name] && Boolean(errors[name])}
    fullWidth
    helperText={touched[name] && errors[name]}
    hiddenLabel
    name={name}
    onBlur={onBlur}
    onChange={onChange}
    value={value || ''}
    variant="outlined"
    {...props}
  />
);

export default memo(function TextField({
  name,
  label,
  type = 'text',
  placeholder,
  helperText,
  required = false,
  namePrefix,
  isCpgField = false
}) {
  const { values } = useFormikContext();
  const fieldName = namePrefix ? `${namePrefix}.${name}` : name;
  const fieldStyles = useFieldStyles();
  const styles = useStyles();

  const labelId = useMemo(() => {
    if (!label) return null;
    return `TextField-${(labelUuid += 1)}`;
  }, [label]);

  return (
    <div className={fieldStyles.field}>
      {label && (
        <label htmlFor={labelId} className={clsx(fieldStyles.fieldLabel, fieldStyles.fieldLabelGroup)}>
          <div>
            {label}
            {required && <span className={styles.required}>*</span>}
          </div>
          {isCpgField && (
            <div className={clsx(styles.cpgTag, isCpgComplete(name, values) && styles.cpgTagComplete)}>CPG</div>
          )}
          :
        </label>
      )}

      <div className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputFullWidth)}>
        <FastField
          component={MuiFastField}
          id={labelId}
          name={fieldName}
          placeholder={placeholder}
          required={required}
          type={type}
        />

        {helperText && <div className={fieldStyles.helperText}>{helperText}</div>}
      </div>
    </div>
  );
});
