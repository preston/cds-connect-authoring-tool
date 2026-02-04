import React, { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form, useFormikContext } from 'formik';

import { TextField } from 'components/fields';
import cpgFields, { versionHelperText } from './cpgFields';
import useStyles from './styles';

const ArtifactModalForm = memo(({ setSubmitDisabled }) => {
  const { isValid } = useFormikContext();
  const styles = useStyles();

  useEffect(() => setSubmitDisabled(!isValid), [isValid, setSubmitDisabled]);

  return (
    <Form className={styles.artifactForm}>
      <TextField name="name" label="Artifact Name" required={true} />
      <TextField name="version" label="Version" helperText={versionHelperText} />

      {cpgFields.map(field => {
        const FormComponent = field.component;
        return <FormComponent key={field.name} {...field} />;
      })}
    </Form>
  );
});

ArtifactModalForm.propTypes = {
  setSubmitDisabled: PropTypes.func.isRequired
};

export default ArtifactModalForm;
