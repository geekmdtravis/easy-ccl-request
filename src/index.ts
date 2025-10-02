import {
  CclCallParam,
  CclRequestResponse,
  makeCclRequestAsync,
  XmlCclResult,
  XmlCclReadyState,
} from './makeCclRequestAsync';
import { Verbosity } from './utils';

// Export functions
export { makeCclRequestAsync };

// Export types; cannot use the `export type` syntax.
export {
  CclCallParam,
  CclRequestResponse,
  XmlCclReadyState,
  XmlCclResult,
  Verbosity,
};

export type PowerChartReturn = {
  inPowerChart: boolean;
};

declare global {
  /**
   * Class for the Cerner Windows COM Object for an XMLCclRequest.
   * Useful for development but not intended for production use. Use of
   * this method in that context requires the following meta tag in the
   * head of the HTML document: `<META content='XMLCCLREQUEST' name='discern'>`
   * [More Info](https://wiki.cerner.com/display/public/MPDEVWIKI/XMLCCLREQUEST)
   */
  class XMLCclRequest {
    options: Object;
    readyState: number;
    responseText: string;
    status: number;
    statusText: string;
    sendFlag: boolean;
    errorFlag: boolean;
    responseBody: string;
    responseXML: string;
    async: boolean;
    requestBinding: string;
    requestText: string;
    blobIn: string;
    url: string;
    method: string;
    requestHeaders: Object;
    requestLen: number;
    onreadystatechange: () => void;
    onerror: () => void;
    abort: () => void;
    getAllResponseHeaders: () => Array<string>;
    getResponseHeader: (header: string) => string;
    open(method: string, url: string, async?: boolean): void;
    send(data: string): void;
    setRequestHeader: (name: string, value: string) => void;
    cleanup: () => void;

    constructor(); // Allow using the `new` keyword
  }

  interface Window {
    readonly external: External;
  }

  interface External {
    /**
     * Funtion that returns a Cerner Windows COM object for an XMLCclRequest.
     * Useful for development but not intended for production use. Use of
     * this method in that context requires the following meta tag in the
     * head of the HTML document: `<META content='XMLCCLREQUEST' name='discern'>`
     * [More Info](https://wiki.cerner.com/display/public/MPDEVWIKI/XMLCCLREQUEST)
     */
    XMLCclRequest: () => XMLCclRequest;
  }
}
