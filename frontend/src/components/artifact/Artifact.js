import React, { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import clsx from 'clsx';

import ArtifactModal from './ArtifactModal';
import ArtifactTable from './ArtifactTable';
import { useSpacingStyles, useTextStyles } from 'styles/hooks';
import { addArtifact, deleteArtifact, fetchArtifacts, updateArtifact, duplicateArtifact } from 'queries/artifacts';

import { HelpLink } from 'components/elements';

import useStyles from './styles';

const Artifact = () => {
  const [showModal, setShowModal] = useState(false);
  const spacingStyles = useSpacingStyles();
  const textStyles = useTextStyles();
  const queryClient = useQueryClient();
  const styles = useStyles();
  const { data, error, isLoading, isSuccess } = useQuery({
    queryKey: ['artifacts'],
    queryFn: () => fetchArtifacts()
  });
  const artifacts = data ?? [];
  const resetArtifacts = () => queryClient.invalidateQueries(['artifacts']);
  const { mutateAsync: asyncDeleteArtifact } = useMutation({
    mutationFn: deleteArtifact,
    onSuccess: resetArtifacts
  });
  const { mutateAsync: asyncAddArtifact } = useMutation({
    mutationFn: addArtifact,
    onSuccess: resetArtifacts
  });
  const { mutateAsync: asyncDuplicateArtifact } = useMutation({
    mutationFn: duplicateArtifact,
    onSuccess: resetArtifacts
  });
  const { mutateAsync: asyncUpdateArtifact } = useMutation({
    mutationFn: updateArtifact,
    onSuccess: resetArtifacts
  });
  const handleDuplicateArtifact = useCallback(
    async artifactProps => {
      try {
        await asyncDuplicateArtifact({ artifactProps });
      } catch (error) {
        console.error('Duplicate artifact failed:', error);
      }
    },
    [asyncDuplicateArtifact]
  );
  const handleDeleteArtifact = useCallback(
    async artifact => {
      try {
        await asyncDeleteArtifact({ artifact });
      } catch (error) {
        console.error('Delete artifact failed:', error);
      }
    },
    [asyncDeleteArtifact]
  );
  const handleAddArtifact = useCallback(
    async artifactProps => {
      try {
        await asyncAddArtifact({ artifactProps });
      } catch (error) {
        console.error('Add artifact failed:', error);
      }
    },
    [asyncAddArtifact]
  );
  const handleUpdateArtifact = useCallback(
    async (artifact, artifactProps) => {
      try {
        await asyncUpdateArtifact({ artifact, artifactProps });
      } catch (error) {
        console.error('Update artifact failed:', error);
      }
    },
    [asyncUpdateArtifact]
  );

  return (
    <div className={spacingStyles.globalPadding} id="maincontent">
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading && <CircularProgress />}

      {isSuccess && (
        <div className={clsx(spacingStyles.minHeight, spacingStyles.verticalPadding)}>
          {/* NOTE: This alert can be used to provide a quick notice to AT users. To use it, uncomment the div and update the text. */}
          {/* To conditionally render the banner (e.g. to dismiss it after a certain time), uncomment the conditional portion before the div as well. */}
          {/* {new Date() < new Date('May 31, 2024') && ( */}
          {/* <div className={spacingStyles.verticalPadding}>
            <Alert severity={'error'}>
              Note: Some important message to AT users
            </Alert>
          </div> */}
          {/* )} */}
          <div className={styles.helpLink}>
            <Button color="primary" onClick={() => setShowModal(true)} startIcon={<AddIcon />} variant="contained">
              Create New Library
            </Button>
            <HelpLink linkPath="documentation/userguide#Creating_and_Managing_Artifacts" showText />
          </div>

          {artifacts.length > 0 ? (
            <ArtifactTable
              artifacts={artifacts}
              handleDeleteArtifact={handleDeleteArtifact}
              handleDuplicateArtifact={handleDuplicateArtifact}
              handleUpdateArtifact={handleUpdateArtifact}
            />
          ) : (
            <div className={clsx(spacingStyles.verticalPadding, textStyles.italic)}>No artifacts to show.</div>
          )}
        </div>
      )}

      {showModal && (
        <ArtifactModal handleAddArtifact={handleAddArtifact} handleCloseModal={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default Artifact;
