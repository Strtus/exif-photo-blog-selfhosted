import { act, renderHook } from '@testing-library/react';
import useScrollDirection from '@/utility/useScrollDirection';

describe('scroll frame scheduling', () => {
  let callbacks: FrameRequestCallback[];
  beforeEach(() => {
    callbacks = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callbacks.push(callback);
      return callbacks.length;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true, value: 5000,
    });
  });
  afterEach(() => { jest.restoreAllMocks(); });

  const scroll = (y: number) => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
    window.dispatchEvent(new Event('scroll'));
  };

  it('coalesces rapid scrolls into one frame and uses the latest position', () => {
    const { result } = renderHook(() => useScrollDirection());
    act(() => { scroll(100); scroll(300); scroll(700); });
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(result.current.scrollY).toBe(0);
    act(() => { callbacks[0](0); });
    expect(result.current).toEqual({ scrollY: 700, scrollDirection: 'down' });
    act(() => { scroll(600); callbacks[1](0); });
    expect(result.current).toEqual({ scrollY: 600, scrollDirection: 'up' });
  });

  it('cancels pending work on unmount', () => {
    const { unmount } = renderHook(() => useScrollDirection());
    act(() => { scroll(100); });
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});
