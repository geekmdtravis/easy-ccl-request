import { CclCallParam } from './makeCclRequestAsync';
import {
  standardizeCclCallParams,
  isCclCallParam,
  errorIndicatesNotInPowerChart,
  parseResponseJson,
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
  it('should return true if the error message contains "MPAGES_EVENT"', () => {
    const error = new TypeError('MPAGES_EVENT is not a function');
    const result = errorIndicatesNotInPowerChart(error);
    expect(result).toBe(true);
  });
  it('should return true if the error message contains "XMLCclRequest"', () => {
    const error = new TypeError('XMLCclRequest is not a function');
    const result = errorIndicatesNotInPowerChart(error);
    expect(result).toBe(true);
  });
  it('should return true if the error message contains "APPLINK"', () => {
    const error = new TypeError('APPLINK is not a function');
    const result = errorIndicatesNotInPowerChart(error);
    expect(result).toBe(true);
  });
  it('should return true if the error message contains "DiscernObjectFactory"', () => {
    const error = new TypeError('DiscernObjectFactory is not a function');
    const result = errorIndicatesNotInPowerChart(error);
    expect(result).toBe(true);
  });
  it('is case insensitive', () => {
    const error = new TypeError('mpages_event is not a function');
    const result = errorIndicatesNotInPowerChart(error);
    expect(result).toBe(true);
  });
  it('should return false if the error message does not contain any of the expected strings', () => {
    const error = new TypeError('test error');
    const result = errorIndicatesNotInPowerChart(error);
    expect(result).toBe(false);
  });
});

describe('parsedResponseText', () => {
  it('returns the parsed response text when the response text is valid JSON', () => {
    const responseText = '{"test": "test"}';
    const result = parseResponseJson(responseText);
    expect(result).toEqual({ test: 'test' });
  });
  it('returns undefined when the response text is not valid JSON', () => {
    const responseText = 'test';
    const result = parseResponseJson(responseText);
    expect(result).toBeUndefined();
  });
  it('propagates an error if an unexpected error occurs', () => {
    const responseText = 'test';
    jest.spyOn(JSON, 'parse').mockImplementationOnce(() => {
      throw new Error('test error');
    });
    expect(() => parseResponseJson(responseText)).toThrowError();
  });
});

describe('standardizeCclCallParams', () => {
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
    const result = standardizeCclCallParams(params, false);
    expect(result).toEqual("'MINE','test',1");
  });

  it('missing params returns only MINE', () => {
    const result = standardizeCclCallParams();
    expect(result).toEqual("'MINE'");
  });

  it('empty params list return only MINE', () => {
    const params: Array<CclCallParam> = [];
    const result = standardizeCclCallParams(params);
    expect(result).toEqual("'MINE'");
  });
  it('includes MINE as the first parameter when excludeMine is excluded', () => {
    const params: Array<CclCallParam> = [
      {
        type: 'string',
        param: 'test',
      },
    ];
    const result = standardizeCclCallParams(params);
    expect(result).toEqual("'MINE','test'");
  });
  it('remove MINE from the parameters when excludeMine parameter set to true', () => {
    const params: Array<CclCallParam> = [
      {
        type: 'string',
        param: 'test',
      },
    ];
    const result = standardizeCclCallParams(params, true);
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
    const result = standardizeCclCallParams(params, true);
    expect(result).toEqual("1234,'test',6789,'test2','test3'");
  });
  it('throws an error when invalid parameters are given', () => {
    const params: Array<number | string> = [{ test: 'test' } as any];
    expect(() => standardizeCclCallParams(params, true)).toThrowError();
  });
});
