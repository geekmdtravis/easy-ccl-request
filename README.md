# easy-ccl-request

A simple utility to make CCL requests to the Cerner Discern environment. It's a wrapper around the `XMLCclRequest` native function in the Cerner Discern environment.

| Environment | CI                                                                                                                             | Publish                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Production  | ![Main Build](https://github.com/geekmdtravis/easy-ccl-request/actions/workflows/main.yml/badge.svg?branch=main)               | ![Main Publish](https://github.com/geekmdtravis/easy-ccl-request/actions/workflows/publish.yml/badge.svg) |
| Development | ![Development Build](https://github.com/geekmdtravis/easy-ccl-request/actions/workflows/main.yml/badge.svg?branch=development) | Not Applicable                                                                                            |

## Contributors

If you'd like to become a contributor, please contact the primary author.

- [Travis Nesbit, MD (geekmdtravis)](https://github.com/geekmdtravis/) - Primary Author

## Example Use

Make a requestion for a JSON object from a CCL end-point. Just pass the CCL program name (often referenced as the URL) and the parameters as an array of either strings or numbers.

```typescript
const { data, status, result } = await makeCclRequestAsync(
  '1_GET_VITALS_DT_RNG',
  [391414, 1234124, '2022-01-01', '2022-12-31']
);
```

## Utility Map

| Discern         | _easy-ccl-request_    | Description                            |
| --------------- | --------------------- | -------------------------------------- |
| `XMLCclRequest` | `makeCclRequestAsync` | Makes an AJAX call to a CCL end-point. |

```

```
