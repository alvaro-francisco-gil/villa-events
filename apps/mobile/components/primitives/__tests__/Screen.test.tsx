import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Screen } from '../Screen';

describe('<Screen>', () => {
  it('renders children inside a SafeAreaView', () => {
    const { getByText } = render(
      <Screen>
        <Text>hello</Text>
      </Screen>
    );
    expect(getByText('hello')).toBeTruthy();
  });

  it('applies padding by default', () => {
    const { getByTestId } = render(
      <Screen testID="screen">
        <Text>x</Text>
      </Screen>
    );
    const screen = getByTestId('screen');
    expect(screen.props.className).toMatch(/p-4|px-4/);
  });
});
