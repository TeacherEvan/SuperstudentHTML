import { ResourceManager } from '../../src/js/core/resourceManager.js';
import AlphabetLevel from '../../src/js/game/levels/alphabetLevel.js';

function setViewport(width, height) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height
  });
}

describe('Gameplay regressions', () => {
  beforeEach(() => {
    document.body.innerHTML = '<canvas id="game-canvas" width="800" height="600"></canvas>';
    window.localStorage.getItem.mockReset();
    window.localStorage.setItem.mockReset();
    setViewport(800, 600);
  });

  test('resource manager auto-detects qboard mode for large displays without a saved override', () => {
    setViewport(3000, 1600);
    window.localStorage.getItem.mockReturnValue(null);

    const resourceManager = new ResourceManager();

    expect(resourceManager.getDisplayMode()).toBe('QBOARD');
  });

  test('alphabet level uses frame-based spawn timing instead of raw milliseconds', async () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const level = new AlphabetLevel(
      canvas,
      ctx,
      {
        runtime: { e2eConfig: { enabled: false } },
        displaySettings: { mode: 'DEFAULT' }
      },
      {
        createExplosion: jest.fn(),
        applyScreenShake: jest.fn(),
        onLevelComplete: jest.fn()
      }
    );

    await level.init();

    level.update(200);
    expect(level.objects).toHaveLength(0);

    level.update(799);
    expect(level.objects).toHaveLength(0);

    level.update(2);
    expect(level.objects).toHaveLength(1);

    level.cleanup();
  });
});
