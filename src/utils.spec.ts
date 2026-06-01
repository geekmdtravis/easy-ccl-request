import { vi } from 'vitest';
import { CclCallParam } from './makeCclRequestAsync';
import {
  isCclCallParam,
  logger,
  outsideOfPowerChartError,
  warnAttemptedOrdersOutsideOfPowerChart,
} from './utils';

describe('isCclCallParam', () => {
  it('should return true if the object is a CclCallParam', () => {
    const validParam: CclCallParam = {
      type: 'string',
      param: 'MINE',
    };
    const result = isCclCallParam(validParam);
    expect(result).toBe(true);
  });
  it('should return false if the object is not a CclCallParam', () => {
    const invalidParam = {
      badfield1: 'string',
      badfield2: 'MINE',
    };
    const result = isCclCallParam(invalidParam);
    expect(result).toBe(false);
  });
  it('should return true if the object is a CclCallParam and the fields are falsy', () => {
    const validParam: CclCallParam = {
      type: 'number',
      param: 0,
    };
    const result = isCclCallParam(validParam);
    expect(result).toBe(true);
  });
});

describe('outsideOfPowerChartError', () => {
  it('returns true for a TypeError with XMLCclRequest is not a function', () => {
    const e = new TypeError('XMLCclRequest is not a function');
    expect(outsideOfPowerChartError(e)).toBe(true);
  });

  it.each([['MPAGES_EVENT'], ['APPLINK'], ['DiscernObjectFactory']])(
    'returns true for a TypeError with %s is not a function',
    token => {
      const e = new TypeError(`${token} is not a function`);
      expect(outsideOfPowerChartError(e)).toBe(true);
    }
  );

  it('matches case-insensitively', () => {
    const e = new TypeError('xmlcclrequest is not a function');
    expect(outsideOfPowerChartError(e)).toBe(true);
  });

  it('returns false for a TypeError whose message does not match', () => {
    const e = new TypeError('foo is not a function');
    expect(outsideOfPowerChartError(e)).toBe(false);
  });

  it('returns false for a non-TypeError Error even if the message matches', () => {
    const e = new Error('XMLCclRequest is not a function');
    expect(outsideOfPowerChartError(e)).toBe(false);
  });

  it('returns false for null', () => {
    expect(outsideOfPowerChartError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(outsideOfPowerChartError(undefined)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(outsideOfPowerChartError('a string')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(outsideOfPowerChartError(42)).toBe(false);
  });

  it('returns false for a plain object', () => {
    expect(outsideOfPowerChartError({})).toBe(false);
  });
});

describe('warnAttemptedOrdersOutsideOfPowerChart', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls console.warn once with the formatted event string', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnAttemptedOrdersOutsideOfPowerChart('test-event');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      "window.MPAGES_EVENT('ORDERS', 'test-event')"
    );
  });

  it('handles an empty string input', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnAttemptedOrdersOutsideOfPowerChart('');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("window.MPAGES_EVENT('ORDERS', '')");
  });
});

describe('logger', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not log anything when verbosity is "none"', () => {
    logger('none', 'error', 'msg');
    logger('none', 'warning', 'msg');
    logger('none', 'info', 'msg');
    logger('none', 'debug', 'msg');
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('verbosity "error" only logs error-level messages', () => {
    logger('error', 'error', 'msg');
    logger('error', 'warning', 'msg');
    logger('error', 'info', 'msg');
    logger('error', 'debug', 'msg');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('verbosity "warning" logs error and warning messages', () => {
    logger('warning', 'error', 'msg');
    logger('warning', 'warning', 'msg');
    logger('warning', 'info', 'msg');
    logger('warning', 'debug', 'msg');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('verbosity "info" logs error, warning, and info messages', () => {
    logger('info', 'error', 'msg');
    logger('info', 'warning', 'msg');
    logger('info', 'info', 'msg');
    logger('info', 'debug', 'msg');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('verbosity "debug" logs every level', () => {
    logger('debug', 'error', 'msg');
    logger('debug', 'warning', 'msg');
    logger('debug', 'info', 'msg');
    logger('debug', 'debug', 'msg');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy).toHaveBeenCalledTimes(1);
  });

  it('passes { data } as the second argument when data is provided', () => {
    const data = { foo: 'bar' };
    logger('debug', 'info', 'hello', data);
    expect(infoSpy).toHaveBeenCalledWith('hello', { data });
  });

  it('passes {} as the second argument when data is omitted', () => {
    logger('debug', 'info', 'hello');
    expect(infoSpy).toHaveBeenCalledWith('hello', {});
  });

  it('routes level "error" to console.error', () => {
    logger('debug', 'error', 'msg');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('routes level "warning" to console.warn', () => {
    logger('debug', 'warning', 'msg');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('routes level "info" to console.info', () => {
    logger('debug', 'info', 'msg');
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('routes level "debug" to console.debug', () => {
    logger('debug', 'debug', 'msg');
    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });
});
