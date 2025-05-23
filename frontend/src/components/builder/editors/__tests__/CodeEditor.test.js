import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { render, userEvent, fireEvent, screen, waitFor } from 'utils/test-utils';
import CodeEditor from '../CodeEditor';

describe('<CodeEditor />', () => {
  const renderUnauthenticatedComponent = (props = {}) =>
    render(<CodeEditor handleUpdateEditor={jest.fn()} isConcept={false} value={null} {...props} />);

  const renderComponent = (props = {}) =>
    render(
      <Provider store={createStore(x => x, { vsac: { apiKey: 'abcd-1234' } })}>
        <CodeEditor handleUpdateEditor={jest.fn()} isConcept={false} value={null} {...props} />
      </Provider>
    );

  describe('Code Editor', () => {
    it('shows Authenticate VSAC button if unauthenticated', () => {
      const { getByText } = renderUnauthenticatedComponent();

      expect(getByText('Authenticate VSAC')).toBeInTheDocument();
    });

    it('calls handleUpdateEditor with code', async () => {
      const handleUpdateEditor = jest.fn();
      const { getByText } = renderComponent({ handleUpdateEditor });

      expect(getByText('Add Code')).toBeInTheDocument();

      await waitFor(() => userEvent.click(screen.getByRole('button')));
      fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), { target: { value: '123' } });
      await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: 'Code system' })));
      await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'SNOMED' })));
      await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'Select' })));

      expect(handleUpdateEditor).toBeCalledWith({
        id: expect.any(String),
        system: 'SNOMED',
        uri: 'http://snomed.info/sct',
        code: '123',
        display: '',
        str: `Code '123' from "SNOMED"`
      });
    });

    it('can add more than one code', async () => {
      const handleUpdateEditor = jest.fn();
      const { getByText } = renderComponent({ handleUpdateEditor });

      expect(getByText('Add Code')).toBeInTheDocument();

      await waitFor(() => userEvent.click(screen.getByRole('button')));
      fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), { target: { value: '123' } });
      await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: 'Code system' })));
      await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'SNOMED' })));
      await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'Select' })));

      await waitFor(() => userEvent.click(screen.getByRole('button', { hidden: true })));
      fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), { target: { value: '456' } });
      await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: 'Code system' })));
      await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'SNOMED' })));
      await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'Select' })));

      expect(handleUpdateEditor).toBeCalledWith({
        id: expect.any(String),
        system: 'SNOMED',
        uri: 'http://snomed.info/sct',
        code: '123',
        display: '',
        str: `Code '123' from "SNOMED"`
      });

      expect(handleUpdateEditor).toBeCalledWith({
        id: expect.any(String),
        system: 'SNOMED',
        uri: 'http://snomed.info/sct',
        code: '456',
        display: '',
        str: `Code '456' from "SNOMED"`
      });
    });
  });

  describe('Concept Editor', () => {
    it('shows Authenticate VSAC button if unauthenticated', () => {
      const { getByText } = renderUnauthenticatedComponent({ isConcept: true });

      expect(getByText('Authenticate VSAC')).toBeInTheDocument();
    });

    it('calls handleUpdateEditor with code', async () => {
      const handleUpdateEditor = jest.fn();
      const { getByText } = renderComponent({ handleUpdateEditor, isConcept: true });

      expect(getByText('Add Code')).toBeInTheDocument();

      await waitFor(() => userEvent.click(screen.getByRole('button')));
      fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), { target: { value: '123' } });
      await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: 'Code system' })));
      await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'SNOMED' })));
      await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'Select' })));

      expect(handleUpdateEditor).toBeCalledWith({
        id: expect.any(String),
        system: 'SNOMED',
        uri: 'http://snomed.info/sct',
        code: '123',
        display: '',
        str: `Concept { Code '123' from "SNOMED" }`
      });
    });
  });
});
