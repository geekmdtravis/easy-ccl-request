import { CclCallParam } from '../makeCclRequestAsync';

/**
 * Check to see if the error reflects likely being outside of PowerChart.
 * @param e {Error} - The error to be checked.
 * @returns {boolean} - Returns `true` if the error is one of two cases that result
 * from being outside of Cerner PowerChart.
 */
export function errorIndicatesNotInPowerChart(e: unknown) {
  return (
    e instanceof TypeError &&
    /(MPAGES_EVENT|XMLCclRequest|APPLINK|DiscernObjectFactory) is not a function/i.test(
      e.message
    )
  );
}

/**
 * Check an object to see if it is a CclCallParam.
 * @param param - an object of any type to check if it is a CclCallParam.
 * @returns true if the object is a CclCallParam, false otherwise.
 */
export function isCclCallParam(param: any): param is CclCallParam {
  return typeof param === 'object' && 'type' in param && 'param' in param;
}

/**
 * Parse the response text from an XmlCclRequest into a JSON object, if possible.
 * @param res - the response text from the XmlCclRequest.
 * @returns a parsed JSON object or undefined if the response text is not valid JSON.
 */
export function parseResponseJson<T>(res: string): T | undefined {
  try {
    return JSON.parse(res) as T;
  } catch (e) {
    if (e instanceof SyntaxError) {
      return undefined;
    } else {
      throw e;
    }
  }
}

/**
 * A function which processes the CCL request parameters, converting them to a string compatible with an XmlCclRequest.
 * @param params {Array<CclCallParam|string|number>} An array of CclCallParam objects when explicitly defining
 * type, or strings and numbers when implicitly defining type, each of which represents
 * @param excludeMine {boolean} Determines whether or not to include the "MINE" parameter as the
 * @returns {string} the XmlCclRequest compatible string.
 * @throws {TypeError} if an invalid parameter type is passed.
 */
export function standardizeCclCallParams(
  params?: Array<CclCallParam | string | number>,
  excludeMine?: boolean
) {
  params = params || [];

  const processedParams: Array<CclCallParam> = params.map(param => {
    if (typeof param === 'string') {
      return { type: 'string', param: param };
    } else if (typeof param === 'number') {
      return { type: 'number', param: param };
    } else if (isCclCallParam(param)) {
      return param;
    } else {
      throw new TypeError(
        `makeCclRequestAsync params can only be string, number, or CclCallParam`
      );
    }
  });

  const mineParam: CclCallParam = {
    type: 'string',
    param: 'MINE',
  };

  if (!excludeMine) {
    processedParams.unshift(mineParam);
  }
  const paramString = processedParams
    .map(({ type, param }) => (type === 'string' ? `'${param}'` : param))
    .join(',');

  return paramString;
}
