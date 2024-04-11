import { CclCallParam } from './makeCclRequestAsync';
import { isCclCallParam } from './utils';

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
