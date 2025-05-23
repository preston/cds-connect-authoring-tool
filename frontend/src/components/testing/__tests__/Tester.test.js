import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { render, screen, userEvent, waitFor } from 'utils/test-utils';
import nock from 'nock';

import { mockArtifact } from 'mocks/artifacts';
import { mockPatientDstu2, mockPatientStu3, mockPatientR4 } from 'mocks/patients';
import { mockElmFilesDstu2, mockElmFilesStu3, mockElmFilesR4 } from 'mocks/elm-files';
import Tester, { validate404ErrorMessage } from '../Tester';

describe('<Tester />', () => {
  const renderComponent = () =>
    render(
      <Provider store={createStore(x => x, { vsac: { apiKey: 'abcd-1234' } })}>
        <Tester />
      </Provider>
    );

  let scope;
  beforeEach(() => {
    scope = nock('http://localhost')
      .get('/authoring/api/testing')
      .optionally()
      .reply(200, [mockPatientR4, mockPatientStu3, mockPatientDstu2])
      .get('/authoring/api/artifacts')
      .optionally()
      .reply(200, [mockArtifact]);
  });

  afterAll(() => nock.restore());

  describe('CQL execution', () => {
    const executeCQLOnSelectedPatients = async () => {
      await waitFor(() => userEvent.click(screen.getByRole('button', { name: /Execute CQL on Selected Patients/ })));

      expect(await screen.findByText(/FHIR Compatible Artifacts/)).toBeInTheDocument();

      await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: /select\.\.\./i })));
      await waitFor(() => userEvent.click(screen.getByRole('option', { name: /Untitled Artifact/ })));
      await waitFor(() => userEvent.click(screen.getByRole('button', { name: /Execute CQL/i })));
    };

    it('displays CQL validation errors', async () => {
      scope = scope
        .post('/authoring/api/cql/validate?includeCQL=true', {
          ...mockArtifact,
          dataModel: { name: 'FHIR', version: '3.0.0' }
        })
        .reply(200, {
          ...mockElmFilesStu3,
          elmErrors: [
            {
              endChar: 61,
              endLine: 7,
              errorSeverity: 'error',
              errorType: 'semantic',
              libraryId: 'Untitled-Artifact',
              libraryVersion: '1.0.0',
              message: 'Could not resolve reference to code system undefined.',
              startChar: 51,
              startLine: 7,
              type: 'CqlToElmError'
            }
          ]
        });

      renderComponent();

      expect(await screen.findByText(/Select one or more patients below and execute CQL/)).toBeInTheDocument();

      await waitFor(() => userEvent.click(screen.getByRole('checkbox', { name: /arnulfo253 mcclure239/i })));
      await executeCQLOnSelectedPatients();

      expect(await screen.findByText(/About your CQL/)).toBeInTheDocument();
      expect(screen.getByText(/Could not resolve reference to code system undefined/)).toBeInTheDocument();
    });

    it('displays the known error when CQL validation fails with a 404 not found', async () => {
      scope = scope
        .post('/authoring/api/cql/validate?includeCQL=true', {
          ...mockArtifact,
          dataModel: { name: 'FHIR', version: '3.0.0' }
        })
        .reply(404);

      renderComponent();

      expect(await screen.findByText(/Select one or more patients below and execute CQL/)).toBeInTheDocument();

      await waitFor(() => userEvent.click(screen.getByRole('checkbox', { name: /arnulfo253 mcclure239/i })));
      await executeCQLOnSelectedPatients();

      expect(await screen.findByText(new RegExp(validate404ErrorMessage))).toBeInTheDocument();
    });

    describe('STU3 patients', () => {
      it('validates and executes the CQL on selected patients', async () => {
        scope = scope
          .post('/authoring/api/cql/validate?includeCQL=true', {
            ...mockArtifact,
            dataModel: { name: 'FHIR', version: '3.0.0' }
          })
          .reply(200, mockElmFilesStu3);

        renderComponent();

        expect(await screen.findByText(/Select one or more patients below and execute CQL/)).toBeInTheDocument();

        await waitFor(() => userEvent.click(screen.getByRole('checkbox', { name: /arnulfo253 mcclure239/i })));
        await executeCQLOnSelectedPatients();

        expect(await screen.findByText(/cql execution results/i)).toBeInTheDocument();

        // We expect the CQL to be present in the modal ready for display, so search for some CQL text
        // NOTE: The CQL does not match the ELM in the mockElmFilesStu3 mock file, which is ok for these tests
        await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'View Detailed Results' })));
        expect(screen.getAllByText(/"Inpatient Encounter Exists"/)).toHaveLength(2);

        expect(screen.getByLabelText(/meets inclusion criteria:/i)).toHaveTextContent('0 of 1 patients');
        expect(screen.getByLabelText(/meets exclusion criteria:/i)).toHaveTextContent('0 of 1 patients');
        expect(screen.getByLabelText(/meetsinclusioncriteria:/i)).toHaveTextContent('No Value');
        expect(screen.getByLabelText(/meetsexclusioncriteria:/i)).toHaveTextContent('No Value');
        expect(screen.getByLabelText(/recommendation:/i)).toHaveTextContent('No Value');
        expect(screen.getByLabelText(/rationale:/i)).toHaveTextContent('No Value');
        expect(screen.getByLabelText(/errors:/i)).toHaveTextContent('No Value');
      });
    });

    describe('R4 patients', () => {
      it('validates and executes the CQL on selected patients', async () => {
        scope = scope
          .post('/authoring/api/cql/validate?includeCQL=true', {
            ...mockArtifact,
            dataModel: { name: 'FHIR', version: '4.0.1' }
          })
          .reply(200, mockElmFilesR4);

        renderComponent();

        expect(await screen.findByText(/Select one or more patients below and execute CQL/)).toBeInTheDocument();

        await waitFor(() => userEvent.click(screen.getByRole('checkbox', { name: /geneva168 reynolds644/i })));
        await executeCQLOnSelectedPatients();

        expect(await screen.findByText(/cql execution results/i)).toBeInTheDocument();

        // We expect the CQL to be present in the modal ready for display, so search for some CQL text
        // NOTE: The CQL does not match the ELM in the mockElmFilesR4 mock file, which is ok for these tests
        await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'View Detailed Results' })));
        expect(screen.getAllByText(/"Inpatient Encounter Exists"/)).toHaveLength(2);

        expect(screen.getByLabelText(/meets inclusion criteria:/i)).toHaveTextContent('0 of 1 patients');
        expect(screen.getByLabelText(/meets exclusion criteria:/i)).toHaveTextContent('0 of 1 patients');
        expect(screen.getByLabelText(/meetsinclusioncriteria:/i)).toHaveTextContent('No');
        expect(screen.getByLabelText(/meetsexclusioncriteria:/i)).toHaveTextContent('No');
        expect(screen.getByLabelText(/recommendation:/i)).toHaveTextContent('No Value');
        expect(screen.getByLabelText(/rationale:/i)).toHaveTextContent('No Value');
        expect(screen.getByLabelText(/errors:/i)).toHaveTextContent('No Value');
      });
    });

    describe('DSTU2 patients', () => {
      it('validates and executes the CQL on selected patients', async () => {
        scope = scope
          .post('/authoring/api/cql/validate?includeCQL=true', {
            ...mockArtifact,
            dataModel: { name: 'FHIR', version: '1.0.2' }
          })
          .reply(200, mockElmFilesDstu2);

        renderComponent();

        expect(await screen.findByText(/Select one or more patients below and execute CQL/)).toBeInTheDocument();

        await waitFor(() => userEvent.click(screen.getByRole('checkbox', { name: /robin67 baumbach677/i })));
        await executeCQLOnSelectedPatients();

        expect(await screen.findByText(/cql execution results/i)).toBeInTheDocument();

        // We expect the CQL to be present in the modal ready for display, so search for some CQL text
        // NOTE: The CQL does not match the ELM in the mockElmFilesDstu2 mock file, which is ok for these tests
        await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'View Detailed Results' })));
        expect(screen.getAllByText(/"Inpatient Encounter Exists"/)).toHaveLength(2);

        expect(screen.getByLabelText(/meets inclusion criteria:/i)).toHaveTextContent('1 of 1 patients');
        expect(screen.getByLabelText(/meets exclusion criteria:/i)).toHaveTextContent('0 of 1 patients');
        expect(screen.getByLabelText(/meetsinclusioncriteria:/i)).toHaveTextContent('Yes');
        expect(screen.getByLabelText(/meetsexclusioncriteria:/i)).toHaveTextContent('No Value');
        expect(screen.getByLabelText(/recommendation:/i)).toHaveTextContent('Do adult things');
        expect(screen.getByLabelText(/rationale:/i)).toHaveTextContent('No Value');
        expect(screen.getByLabelText(/errors:/i)).toHaveTextContent('No Value');
      });
    });
  });
});
