import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { animate, onScroll } from 'animejs';
import { AnimeStaggerVisual } from './AnimeStaggerVisual';

vi.mock('animejs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('animejs')>();
  return { ...actual, animate: vi.fn(actual.animate), onScroll: vi.fn(actual.onScroll) };
});

describe('AnimeStaggerVisual', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders the animation without promotional copy', () => {
    render(<AnimeStaggerVisual />);

    expect(screen.getByRole('img', { name: /animated coding and judging visualization/i })).toBeInTheDocument();
    expect(screen.queryByText(/advanced staggering|motion study|time staggering/i)).not.toBeInTheDocument();
  });

  it('keeps the visual accessible when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    render(<AnimeStaggerVisual />);

    expect(screen.getByRole('img', { name: /animated coding and judging visualization/i })).toBeInTheDocument();
  });

  it('keeps subtle Anime.js motion on the auth panel when reduced motion is preferred', () => {
    vi.mocked(animate).mockClear();
    vi.stubGlobal('matchMedia', () => ({ matches: true }));

    render(<AnimeStaggerVisual />);

    expect(animate).toHaveBeenCalledWith('.auth-flow-signal', expect.objectContaining({ translateY: 20 }));
  });

  it('links the ambient background animation to the app scroll container', () => {
    const container = document.createElement('main');
    const target = document.createElement('div');
    const scroll = {} as ReturnType<typeof onScroll>;
    vi.mocked(onScroll).mockClear().mockReturnValue(scroll);
    vi.mocked(animate).mockClear();
    vi.stubGlobal('matchMedia', () => ({ matches: true }));

    render(<AnimeStaggerVisual variant="ambient" scrollContainer={{ current: container }} scrollTarget={{ current: target }} />);

    const baseOptions = { target, container, axis: 'y', enter: 'top top', leave: 'bottom bottom' };
    expect(onScroll).toHaveBeenCalledTimes(3);
    expect(onScroll).toHaveBeenNthCalledWith(1, { ...baseOptions, sync: 0.35 });
    expect(onScroll).toHaveBeenNthCalledWith(2, { ...baseOptions, sync: true });
    expect(onScroll).toHaveBeenNthCalledWith(3, { ...baseOptions, sync: true });
    expect(animate).toHaveBeenCalledWith('.dial-travel', expect.objectContaining({ autoplay: scroll, translateX: [0, window.innerWidth * 0.7] }));
    expect(animate).toHaveBeenCalledWith('.dial-orbit', expect.objectContaining({ autoplay: scroll, rotate: '0.25turn' }));
  });
});
