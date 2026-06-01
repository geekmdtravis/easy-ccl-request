import { vi } from 'vitest';
import {
  formattedParams,
  CclCallParam,
  makeCclRequestAsync,
  parsedResponseText,
} from './makeCclRequestAsync';

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
        XMLCclRequest: vi.fn().mockImplementation(() => ({
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

  /**
   * Helper that installs a fake `window.external.XMLCclRequest` whose `send`
   * synchronously triggers the production-code's `onreadystatechange` (and/or
   * `onerror`) handlers using the provided fake response fields.
   */
  type FakeResponse = {
    status?: number;
    statusText?: string;
    responseText?: string;
    readyState?: number;
    /** If true, send invokes onerror instead of onreadystatechange. */
    fireError?: boolean;
    /**
     * If provided, send fires onreadystatechange once per entry in order,
     * mutating the request fields before each call. Useful for simulating
     * intermediate readyStates.
     */
    sequence?: Array<{
      status?: number;
      statusText?: string;
      responseText?: string;
      readyState?: number;
    }>;
    openSpy?: ReturnType<typeof vi.fn>;
    sendSpy?: ReturnType<typeof vi.fn>;
  };

  function installFakeXMLCclRequest(fake: FakeResponse) {
    Object.defineProperty(window, 'external', {
      writable: true,
      value: {
        XMLCclRequest: vi.fn().mockImplementation(() => {
          const reqObj: any = {
            readyState: 0,
            status: 0,
            statusText: '',
            responseText: '',
            onreadystatechange: undefined,
            onerror: undefined,
            open: function (method: string, url: string) {
              if (fake.openSpy) fake.openSpy(method, url);
            },
            send: function (body: string) {
              if (fake.sendSpy) fake.sendSpy(body);
              if (fake.fireError) {
                if (typeof this.onerror === 'function') this.onerror();
                return;
              }
              if (fake.sequence && fake.sequence.length > 0) {
                for (const step of fake.sequence) {
                  if (step.readyState !== undefined)
                    this.readyState = step.readyState;
                  if (step.status !== undefined) this.status = step.status;
                  if (step.statusText !== undefined)
                    this.statusText = step.statusText;
                  if (step.responseText !== undefined)
                    this.responseText = step.responseText;
                  if (typeof this.onreadystatechange === 'function')
                    this.onreadystatechange();
                }
                return;
              }
              this.readyState =
                fake.readyState !== undefined ? fake.readyState : 4;
              this.status = fake.status !== undefined ? fake.status : 200;
              this.statusText =
                fake.statusText !== undefined ? fake.statusText : '';
              this.responseText =
                fake.responseText !== undefined ? fake.responseText : '';
              if (typeof this.onreadystatechange === 'function')
                this.onreadystatechange();
            },
          };
          return reqObj;
        }),
      },
    });
  }

  it('rejects when prg is an empty string', async () => {
    await expect(makeCclRequestAsync('')).rejects.toThrow(
      'The CCL program name cannot be empty.'
    );
  });

  it('rejects when prg is whitespace only', async () => {
    await expect(makeCclRequestAsync('   ')).rejects.toThrow(
      'The CCL program name cannot be empty.'
    );
  });

  it('resolves with parsed data on HTTP 200', async () => {
    installFakeXMLCclRequest({
      status: 200,
      readyState: 4,
      responseText: '{"foo":"bar"}',
      statusText: 'OK',
    });

    const res = await makeCclRequestAsync<{ foo: string }>('TEST');
    expect(res.inPowerChart).toBe(true);
    expect(res.code).toBe(200);
    expect(res.result).toBe('success');
    expect(res.status).toBe('completed');
    expect(res.details).toBe('OK');
    expect(res.data).toEqual({ foo: 'bar' });
    expect(res.__request).toBeDefined();
  });

  it('maps a 2xx code without an explicit status mapping (e.g. 204) to "unknown"', async () => {
    installFakeXMLCclRequest({
      status: 204,
      readyState: 4,
      responseText: '',
      statusText: 'No Content',
    });

    const res = await makeCclRequestAsync('TEST');
    expect(res.code).toBe(204);
    expect(res.result).toBe('unknown');
    expect(res.status).toBe('completed');
    expect(res.details).toBe('No Content');
  });

  it.each([
    { status: 405, statusText: 'Method Not Allowed' },
    { status: 492, statusText: 'Non-Fatal Error' },
    { status: 500, statusText: 'Internal Server Error' },
  ])(
    'rejects on non-2xx status $status with message containing code and statusText',
    async ({ status, statusText }) => {
      installFakeXMLCclRequest({
        status,
        readyState: 4,
        responseText: '',
        statusText,
      });

      await expect(makeCclRequestAsync('TEST')).rejects.toThrow(
        new RegExp(`${status}.*${statusText}`)
      );
    }
  );

  it('rejects when onerror fires', async () => {
    installFakeXMLCclRequest({ fireError: true });
    await expect(makeCclRequestAsync('TEST')).rejects.toThrow(
      'XMLCclRequest encountered a network error.'
    );
  });

  it('does nothing while readyState < 4 and resolves once readyState reaches 4', async () => {
    installFakeXMLCclRequest({
      sequence: [
        { readyState: 1, status: 0, statusText: '', responseText: '' },
        {
          readyState: 4,
          status: 200,
          statusText: 'OK',
          responseText: '{"ok":true}',
        },
      ],
    });

    const res = await makeCclRequestAsync<{ ok: boolean }>('TEST');
    expect(res.code).toBe(200);
    expect(res.result).toBe('success');
    expect(res.status).toBe('completed');
    expect(res.data).toEqual({ ok: true });
  });

  it('calls req.open with ("GET", prg) and req.send with formatted params (excludeMine=false)', async () => {
    const openSpy = vi.fn();
    const sendSpy = vi.fn();
    installFakeXMLCclRequest({
      status: 200,
      readyState: 4,
      responseText: '{}',
      statusText: 'OK',
      openSpy,
      sendSpy,
    });

    await makeCclRequestAsync(
      'MY_PRG',
      [{ type: 'string', param: 'a' }, 1],
      false
    );
    expect(openSpy).toHaveBeenCalledWith('GET', 'MY_PRG');
    expect(sendSpy).toHaveBeenCalledWith("'MINE','a',1");
  });

  it('calls req.send with formatted params (excludeMine=true)', async () => {
    const openSpy = vi.fn();
    const sendSpy = vi.fn();
    installFakeXMLCclRequest({
      status: 200,
      readyState: 4,
      responseText: '{}',
      statusText: 'OK',
      openSpy,
      sendSpy,
    });

    await makeCclRequestAsync(
      'MY_PRG',
      [{ type: 'string', param: 'a' }, 1],
      true
    );
    expect(openSpy).toHaveBeenCalledWith('GET', 'MY_PRG');
    expect(sendSpy).toHaveBeenCalledWith("'a',1");
  });

  it('returns mock response when XMLCclRequest throws outside of PowerChart', async () => {
    Object.defineProperty(window, 'external', {
      writable: true,
      value: {
        XMLCclRequest: vi.fn().mockImplementation(() => {
          throw new TypeError('XMLCclRequest is not a function');
        }),
      },
    });

    const res = await makeCclRequestAsync('TEST');
    expect(res.inPowerChart).toBe(false);
    expect(res.code).toBe(418);
    expect(res.result).toBe('im a teapot');
    expect(res.status).toBe('uninitialized');
  });
});

describe('processCclRequestParams', () => {
  it('returns a proper params string when given inputs as CclCallParams', () => {
    const params: Array<CclCallParam> = [
      {
        type: 'string',
        param: 'test',
      },
      {
        type: 'number',
        param: 1,
      },
    ];
    const result = formattedParams(params, false);
    expect(result).toEqual("'MINE','test',1");
  });

  it('missing params returns only MINE', () => {
    const result = formattedParams();
    expect(result).toEqual("'MINE'");
  });

  it('empty params list return only MINE', () => {
    const params: Array<CclCallParam> = [];
    const result = formattedParams(params);
    expect(result).toEqual("'MINE'");
  });
  it('includes MINE as the first parameter when excludeMine is excluded', () => {
    const params: Array<CclCallParam> = [
      {
        type: 'string',
        param: 'test',
      },
    ];
    const result = formattedParams(params);
    expect(result).toEqual("'MINE','test'");
  });
  it('remove MINE from the parameters when excludeMine parameter set to true', () => {
    const params: Array<CclCallParam> = [
      {
        type: 'string',
        param: 'test',
      },
    ];
    const result = formattedParams(params, true);
    expect(result).toEqual("'test'");
  });
  it('properly processes parameters when the list items types are decided without explicit type declaration', () => {
    const params: Array<number | string | CclCallParam> = [
      1234,
      'test',
      6789,
      'test2',
      { param: 'test3', type: 'string' },
    ];
    const result = formattedParams(params, true);
    expect(result).toEqual("1234,'test',6789,'test2','test3'");
  });
  it('throws an error when invalid parameters are given', () => {
    const params: Array<number | string> = [{ test: 'test' } as any];
    expect(() => formattedParams(params, true)).toThrowError();
  });
});

describe('parsedResponseText', () => {
  it('returns the parsed response text when the response text is valid JSON', () => {
    const responseText = '{"test": "test"}';
    const result = parsedResponseText(responseText);
    expect(result).toEqual({ test: 'test' });
  });
  it('returns undefined when the response text is not valid JSON', () => {
    const responseText = 'test';
    const result = parsedResponseText(responseText);
    expect(result).toBeUndefined();
  });
  it('propagates an error if an unexpected error occurs', () => {
    const responseText = 'test';
    vi.spyOn(JSON, 'parse').mockImplementationOnce(() => {
      throw new Error('test error');
    });
    expect(() => parsedResponseText(responseText)).toThrowError();
  });
});
