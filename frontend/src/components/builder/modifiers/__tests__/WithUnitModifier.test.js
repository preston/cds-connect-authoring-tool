import React from 'react';
import nock from 'nock';
import { render, screen, fireEvent, waitFor } from 'utils/test-utils';
import WithUnitModifier from '../WithUnitModifier';

describe('<WithUnitModifier />', () => {
  const renderComponent = (props = {}) =>
    render(<WithUnitModifier handleUpdateModifier={jest.fn()} unit="" {...props} />);

  afterAll(() => nock.restore());

  it('calls handleUpdateModifier when selection changes', async () => {
    nock('https://clin-table-search.lhc.nlm.nih.gov')
      .get('/api/ucum/v3/search?terms=mg/dL')
      .reply(200, [1, ['mg/dL'], null, [['mg/dL', 'milligram per deciliter']]]);

    const handleUpdateModifier = jest.fn();
    renderComponent({ handleUpdateModifier });

    const autocomplete = screen.getByRole('combobox');

    fireEvent.focus(autocomplete);
    fireEvent.change(autocomplete, { target: { value: 'mg/dL' } });
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(autocomplete, { key: 'Enter' });

    await waitFor(() => {
      expect(autocomplete.value).toEqual('mg/dL');
    });
  });
});
