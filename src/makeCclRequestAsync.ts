import { PowerChartReturn } from '.';
import {
  isCclCallParam,
  outsideOfPowerChartError,
  logger,
  Verbosity,
} from './utils';

/**
 * An input parameter for a CCL call. In internal testing, there were cases
 * where the CCL call would fail if the parameter was not wrapped in single
 * quotes. This type allows for the explicit definition of the type of the
 * parameter and the ability to wrap the parameter in single quotes if needed.
 * @param {'string'|'number'} type - The type of the parameter.
 * @param {string} param - The string representing the parameters value.
 */
export type CclCallParam = {
  type: 'string' | 'number';
  param: string | number;
};

/**
 * A text-based representation of the ready state of an XmlCclRequest.
 */
export type XmlCclReadyState =
  | 'completed'
  | 'interactive'
  | 'loaded'
  | 'loading'
  | 'uninitialized'
  | 'unknown';

/**
 * A text-based representation of the status of an XmlCclRequest.
 */
export type XmlCclResult =
  | 'im a teapot'
  | 'internal server exception'
  | 'invalid state'
  | 'memory error'
  | 'method not allowed'
  | 'non-fatal error'
  | 'success'
  | 'unknown';

/**
 * A type which represents the full set of data returned from an XmlCclRequest
 * and important, formatted metadata to help with debugging and error management.
 * This is a generic type and data will represent the type `T` which is the
 * type or interface which represents the resolved data from the CCL request. The
 * names of the properties **are not** the same as the properties returned by the
 * XmlCclRequest, but are instead named to be more descriptive and to avoid
 * confusion with the native XmlCclRequest properties. A mapping of the native
 * properties to the properties of this type is as follows:
 *
 * | CclRequestResponse         | XmlCclRequest                                 |
 * |----------------------------|-----------------------------------------------|
 * | `code`                     | `status` code                                 |
 * | `result`                   | text representation of `status`               |
 * | `status`                   | text representation of `readyState`           |
 * | `details`                  | `statusText`                                  |
 * | `data`                     | parsed JSON of `responseText`                 |
 * | `__request`                | full request object returned by XMLCclReqeust |
 *
 * A description of the `CclRequestResponse` properties is as follows:
 * @param {number} code - The status code of the request. The values are
 * 200 (success), 405 (method not allowed), 409 (invalid state), 418 (im a teapot),
 * 492 (non-fatal error), 493 (memory error), and 500 (internal server exception).
 * There may be other values not listed by the Cerner documentation. The status code
 * 418 (im a teapot) is a playful way to demonstrate that the request was made outside
 * of the Cerner PowerChart application. This is not a real status code, but is based on
 * the [codified joke in the HTTP specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418).
 * @param {XmlCclResult} result - The text representation of the status code. The values
 * are "success", "method not allowed", "invalid state", "non-fatal error", "memory error",
 * and "internal server exception". There may be other values not listed by the Cerner
 * documentation.
 * @param {XmlCclReadyState} status - The text representation of the ready state.
 * The values are "uninitialized", "loading", "loaded", "interactive", and "completed". The
 * underlying `readyState` numbers are 0, 1, 2, 3, and 4 respectively.
 * @param {string} details - The status text of the request.
 * @param {T} data - The parsed JSON from the response text.
 * @param {XMLCclRequest} __request - The full request object.
 */
export type CclRequestResponse<T> = PowerChartReturn & {
  code: number;
  result: XmlCclResult;
  status: XmlCclReadyState;
  details: string;
  data?: T;
  __request?: XMLCclRequest;
};

/**
 * Make AJAX calls to CCL end-points to retrieve data from the Cerner PowerChart
 * application. This function is a wrapper around the `XMLCclRequest` native Discern function
 * provided by the Cerner PowerChart application that greatly simplifies it's use. This
 * request is ultimately a wrapper around the `XMLHttpRequest` object and is only set to
 * handle GET requests.
 * @param prg {string} - the name of the CCL program to call.
 * @param params {Array<CclCallParam|string|number>} - an array of parameters to pass to the CCL program.
 * @param excludeMine {boolean} - (optional) determines whether or not to include the "MINE" parameter as the
 * first parameter in the CCL request's argument list.
 * @resolves `CclRequestResponse<T>`.
 * @rejects {Error} if the `prg` parameter is an empty string.
 * @rejects {Error} if the request fails for any reason.
 */
// For more information on the XMLCclRequest object, see the Cerner PowerChart
// documentation at https://wiki.cerner.com/pages/releaseview.action?spaceKey=MPDEVWIKI&title=XMLCCLREQUEST#Browsers--827740610
export async function makeCclRequestAsync<T>(
  prg: string,
  params: Array<CclCallParam | string | number> = [],
  excludeMine?: boolean,
  verbosity: Verbosity = 'none'
): Promise<CclRequestResponse<T>> {
  logger(verbosity, 'debug', `makeCclRequestAsync called with prg: ${prg}`, {
    params,
    excludeMine,
    verbosity,
  });

  if (prg.trim() === '') {
    const error = new Error('The CCL program name cannot be empty.');
    logger(verbosity, 'error', error.message);
    throw error;
  }

  return new Promise<CclRequestResponse<T>>((resolve, reject) => {
    const res: CclRequestResponse<T> = {
      inPowerChart: true,
      code: 418,
      result: 'im a teapot',
      status: 'uninitialized',
      details: '',
      data: undefined,
      __request: undefined,
    };
    try {
      logger(verbosity, 'info', `Making CCL request for program: ${prg}`);
      const req = window.external.XMLCclRequest();

      req.onreadystatechange = () => {
        logger(
          verbosity,
          'debug',
          `CCL request readyState changed to: ${req.readyState}`,
          { readyState: req.readyState, status: req.status, request: req }
        );
        const requestComplete = req.readyState === 4;

        if (!requestComplete) return;

        logger(
          verbosity,
          'info',
          `CCL request for program '${prg}' completed.`
        );

        const successfulRequest = req.status >= 200 && req.status < 300;
        if (successfulRequest) {
          logger(
            verbosity,
            'info',
            `CCL request for program '${prg}' was successful.`,
            { status: req.status, statusText: req.statusText }
          );
          res.inPowerChart = true;
          res.code = req.status;
          res.result = statusCodeMap.get(req.status) || 'unknown';
          res.status = readyStateMap.get(req.readyState) || 'unknown';
          res.details = req.statusText;
          res.data = parsedResponseText<T>(req.responseText, verbosity);
          res.__request = req;
          logger(verbosity, 'debug', `Response data for '${prg}'`, res);
          resolve(res);
        } else {
          const error = new Error(
            `Request failed with status: ${req.status} and status text: ${req.statusText}`
          );
          logger(
            verbosity,
            'error',
            `CCL request for program '${prg}' failed.`,
            { status: req.status, statusText: req.statusText }
          );
          reject(error);
        }
      };

      req.onerror = () => {
        const error = new Error('XMLCclRequest encountered a network error.');
        logger(
          verbosity,
          'error',
          `CCL request for program '${prg}' encountered a network error.`
        );
        reject(error);
      };

      req.open('GET', `${prg}`);
      req.send(formattedParams(params, excludeMine, verbosity));
    } catch (e) {
      if (outsideOfPowerChartError(e)) {
        logger(
          verbosity,
          'warning',
          `Not in PowerChart environment. Returning mock response for '${prg}'.`
        );
        res.inPowerChart = false;
        resolve(res);
      } else {
        logger(
          verbosity,
          'error',
          `An unexpected error occurred during CCL request for '${prg}'.`,
          e
        );
        reject(e);
      }
    }
  });
}

/**
 * A function which processes the CCL request parameters, converting them to a string compatible with an XmlCclRequest.
 * @param params {Array<CclCallParam|string|number>} An array of CclCallParam objects when explicitly defining
 * type, or strings and numbers when implicitly defining type, each of which represents
 * @param excludeMine {boolean} Determines whether or not to include the "MINE" parameter as the
 * @returns {string} the XmlCclRequest compatible string.
 * @throws {TypeError} if an invalid parameter type is passed.
 */
export function formattedParams(
  params?: Array<CclCallParam | string | number>,
  excludeMine?: boolean,
  verbosity: Verbosity = 'none'
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
      const error = new TypeError(
        `makeCclRequestAsync params can only be string, number, or CclCallParam`
      );
      logger(verbosity, 'error', error.message, param);
      throw error;
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

  logger(verbosity, 'debug', 'Formatted CCL params:', { paramString });
  return paramString;
}

/**
 * Parse the response text from an XmlCclRequest into a JSON object, if possible.
 * @param responseText - the response text from the XmlCclRequest.
 * @returns a parsed JSON object or undefined if the response text is not valid JSON.
 */
export function parsedResponseText<T>(
  responseText: string,
  verbosity: Verbosity = 'none'
): T | undefined {
  logger(verbosity, 'debug', 'Parsing response text:', { responseText });
  try {
    const parsed = JSON.parse(responseText) as T;
    logger(verbosity, 'debug', 'Successfully parsed response text.', {
      parsed,
    });
    return parsed;
  } catch (e) {
    if (e instanceof SyntaxError) {
      logger(verbosity, 'warning', 'Failed to parse response text as JSON.', {
        responseText,
      });
      return undefined;
    } else {
      logger(
        verbosity,
        'error',
        'An unexpected error occurred during response text parsing.',
        e
      );
      throw e;
    }
  }
}

const readyStateMap: Map<number, XmlCclReadyState> = new Map();
readyStateMap.set(0, 'uninitialized');
readyStateMap.set(1, 'loading');
readyStateMap.set(2, 'loaded');
readyStateMap.set(3, 'interactive');
readyStateMap.set(4, 'completed');

const statusCodeMap: Map<number, XmlCclResult> = new Map();
statusCodeMap.set(200, 'success');
statusCodeMap.set(405, 'method not allowed');
statusCodeMap.set(409, 'invalid state');
statusCodeMap.set(418, 'im a teapot');
statusCodeMap.set(492, 'non-fatal error');
statusCodeMap.set(493, 'memory error');
statusCodeMap.set(500, 'internal server exception');
