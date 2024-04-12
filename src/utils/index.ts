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
 * Check an object to see if it is a CclCallParam.
 * @param param - an object of any type to check if it is a CclCallParam.
 * @returns true if the object is a CclCallParam, false otherwise.
 */
export function isCclCallParam(param: any): param is CclCallParam {
  return typeof param === 'object' && 'type' in param && 'param' in param;
}
