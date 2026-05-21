import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

describe('<Input>', () => {
  it('updates value on change', () => {
    const onChange = jest.fn();
    const { getByDisplayValue } = render(
      <Input value="abc" onChangeText={onChange} />
    );
    fireEvent.changeText(getByDisplayValue('abc'), 'abcd');
    expect(onChange).toHaveBeenCalledWith('abcd');
  });

  it('renders label and error', () => {
    const { getByText } = render(
      <Input label="Email" value="" onChangeText={() => {}} error="Required" />
    );
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Required')).toBeTruthy();
  });
});
