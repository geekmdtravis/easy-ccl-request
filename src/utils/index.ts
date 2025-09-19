import { CclCallParam } from '../makeCclRequestAsync';

/**
 * Check to see if the error reflects likely being outside of PowerChart.
 * @param e {Error} - The error to be checked.
 * @returns {boolean} - Returns `true` if the error is one of two cases that result
 * from being outside of Cerner PowerChart.
 */
export function outsideOfPowerChartError(e: unknown) {
  return (
    e instanceof TypeError &&
    /(MPAGES_EVENT|XMLCclRequest|APPLINK|DiscernObjectFactory) is not a function/i.test(
      e.message
    )
  );
}

/**
 * A wrapper function for the `console.warn` function which logs a warning message.
 * @param eventString {string} - The event string to be logged.
 */
export const warnAttemptedOrdersOutsideOfPowerChart = (
  eventString: string
): void => {
  console.warn(`window.MPAGES_EVENT('ORDERS', '${eventString}')`);
};

export /**
 * Check an object to see if it is a CclCallParam.
 * @param param - an object of any type to check if it is a CclCallParam.
 * @returns true if the object is a CclCallParam, false otherwise.
 */
function isCclCallParam(param: any): param is CclCallParam {
  return typeof param === 'object' && 'type' in param && 'param' in param;
}

export type Verbosity = 'none' | 'error' | 'warning' | 'info' | 'debug';

/**
 * A simple logger that logs messages based on the verbosity level.
 * @param verbosity The current verbosity level.
 * @param level The level of the message.
 * @param message The message to log.
 * @param data Optional data to log.
 */
export function logger(
  verbosity: Verbosity,
  level: 'error' | 'warning' | 'info' | 'debug',
  message: string,
  data?: any
) {
  const verbosityLevels = {
    none: 0,
    error: 1,
    warning: 2,
    info: 3,
    debug: 4,
  };

  if (verbosityLevels[verbosity] >= verbosityLevels[level]) {
    const logData = data ? { data } : {};
    switch (level) {
      case 'error':
        console.error(message, logData);
        break;
      case 'warning':
        console.warn(message, logData);
        break;
      case 'info':
        console.info(message, logData);
        break;
      case 'debug':
        console.debug(message, logData);
        break;
    }
  }
}