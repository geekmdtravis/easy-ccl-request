import { makeCclRequestAsync } from './makeCclRequestAsync';

describe('makeCclRequestAsync', () => {
  it('return inPowerChart as false outside of PowerChart', async () => {
    const { inPowerChart } = await makeCclRequestAsync('TEST', [
      { type: 'string', param: 'param1' },
    ]);
    expect(inPowerChart).toBe(false);
  });

  it('propagates the error when an unexpected error occurs', async () => {
    Object.defineProperty(window, 'external', {
      writable: true,
      value: {
        XMLCclRequest: jest.fn().mockImplementation(() => ({
          // @ts-ignore
          open: (a: string, b: string) => {
            return null;
          },
          // @ts-ignore
          send: (a: string) => {
            throw new Error('test error');
          },
        })),
      },
    });

    await expect(makeCclRequestAsync('TEST')).rejects.toThrow();
  });
});
