import React from 'react';
import { render, fireEvent, userEvent, screen, waitFor } from 'utils/test-utils';
import ValueComparisonModifier from '../ValueComparisonModifier';

describe('<ValueComparisonModifier />', () => {
  const renderComponent = (props = {}) =>
    render(
      <ValueComparisonModifier
        handleUpdateModifier={jest.fn()}
        values={{
          maxOperator: '',
          maxValue: '',
          minOperator: '',
          minValue: '',
          unit: ''
        }}
        {...props}
      />
    );

  it('calls handleUpdateModifier when input changes', async () => {
    const handleUpdateModifier = jest.fn();
    renderComponent({ handleUpdateModifier });

    fireEvent.change(screen.getByRole('spinbutton', { name: 'minValue' }), { target: { value: '21' } });
    expect(handleUpdateModifier).toBeCalledWith({ minValue: 21 });

    await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: /minOp/ })));
    await waitFor(() => userEvent.click(screen.getByRole('option', { name: '<' })));

    await waitFor(() => {
      expect(screen.queryAllByRole('option')).toHaveLength(0);
    });

    fireEvent.change(screen.getByRole('spinbutton', { name: 'maxValue' }), { target: { value: '189' } });
    expect(handleUpdateModifier).toBeCalledWith({ maxValue: 189 });

    const maxOp = screen.getByRole('combobox', { name: /maxOp/ });
    await userEvent.click(maxOp);
    fireEvent.change(maxOp, { target: { value: '!=' } });
    await userEvent.tab();

    expect(handleUpdateModifier).toBeCalledWith({ maxOperator: '!=' });
  }, 30000);
});
