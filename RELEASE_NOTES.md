## Release Notes: 1.0.2-rc.0
This release introduces a new logging feature to provide better insight into the execution of CCL requests.

### Features

*   **Logging with Levels:** The `makeCclRequestAsync` function now includes an optional `verbosity` parameter that allows you to control the level of logging output. The available levels are:
    *   `none` (default): No logging output.
    *   `error`: Logs only when errors occur.
    *   `warning`: Logs warnings and errors.
    *   `info`: Logs informational messages, warnings, and errors.
    *   `debug`: Logs all messages, including debugging information.
*   **New Logger Utility:** A new `logger` utility has been added to handle the logging functionality. This utility provides a simple and consistent way to log messages at different levels.

### Bug Fixes

*   No bug fixes in this release.

### Breaking Changes

*   There are no breaking changes in this release.
