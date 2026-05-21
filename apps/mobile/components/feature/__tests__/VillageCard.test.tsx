import { render, fireEvent } from '@testing-library/react-native';
import { VillageCard } from '../VillageCard';

const fixture = {
  id: 'mun1',
  name: 'Sotos de Mayorga',
};

describe('<VillageCard>', () => {
  it('renders village name', () => {
    const { getByText } = render(<VillageCard village={fixture} onPress={() => {}} />);
    expect(getByText('Sotos de Mayorga')).toBeTruthy();
  });

  it('fires onPress with village id', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <VillageCard village={fixture} onPress={onPress} testID="village-card" />,
    );
    fireEvent.press(getByTestId('village-card'));
    expect(onPress).toHaveBeenCalledWith('mun1');
  });
});
