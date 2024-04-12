import { CclCallParam } from './makeCclRequestAsync';
import { isCclCallParam, outsideOfPowerChartError } from './utils';

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
    const result = outsideOfPowerChartError(error);
    expect(result).toBe(true);
  });
  it('should return true if the error message contains "XMLCclRequest"', () => {
    const error = new TypeError('XMLCclRequest is not a function');
    const result = outsideOfPowerChartError(error);
    expect(result).toBe(true);
  });
  it('should return true if the error message contains "APPLINK"', () => {
    const error = new TypeError('APPLINK is not a function');
    const result = outsideOfPowerChartError(error);
    expect(result).toBe(true);
  });
  it('should return true if the error message contains "DiscernObjectFactory"', () => {
    const error = new TypeError('DiscernObjectFactory is not a function');
    const result = outsideOfPowerChartError(error);
    expect(result).toBe(true);
  });
  it('is case insensitive', () => {
    const error = new TypeError('mpages_event is not a function');
    const result = outsideOfPowerChartError(error);
    expect(result).toBe(true);
  });
  it('should return false if the error message does not contain any of the expected strings', () => {
    const error = new TypeError('test error');
    const result = outsideOfPowerChartError(error);
    expect(result).toBe(false);
  });
});
