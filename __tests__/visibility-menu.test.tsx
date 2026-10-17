import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import SelectMenu from '@/components/SelectMenu';
import { ReactNode } from 'react';

// Scrolling masks depend on browser layout observers; selection is tested here.
jest.mock('@/components/MaskedScroll', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const options = [
  { value: 'default', label: 'Default' },
  { value: 'private', label: 'Private' },
];

beforeAll(() => {
  // jsdom does not implement scrolling; browser coverage exercises real layout.
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe('batch visibility menu', () => {
  it('exposes its label and current placeholder', () => {
    render(<SelectMenu
      name="visibility" label="Visibility" value="" options={options}
      defaultOptionLabel="Choose visibility"
    />);
    const menu = screen.getByRole('combobox', { name: 'Visibility' });
    expect(menu).toHaveTextContent('Choose visibility');
  });
  it('chooses the private value through the shared menu', () => {
    const onChange = jest.fn();
    render(<SelectMenu
      name="visibility" label="Visibility" value="" options={options}
      onChange={onChange}
    />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Private' }));
    expect(onChange).toHaveBeenCalledWith('private');
  });
  it('blocks pointer and keyboard changes while a batch update is pending', () => {
    const onChange = jest.fn();
    render(<SelectMenu
      name="visibility" label="Visibility" value="default" options={options}
      onChange={onChange} readOnly
    />);
    const menu = screen.getByRole('combobox');
    fireEvent.mouseDown(menu);
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'Enter' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveAttribute('aria-disabled', 'true');
    expect(onChange).not.toHaveBeenCalled();
  });
});
