export function formatData(data: any, type: string) {
  if (type == "config") {
    return data.reduce(
      (accumulator, { key, value }) => ({
        ...accumulator,
        [toCamelCase(key)]: value,
      }),
      {}
    );
  }
  // Assuming data is an object with nodes containing arrays
  return data.reduce((accumulator, item) => {
    const fields = item.fields.reduce(
      (acc, field) => ({
        ...acc,
        [toCamelCase(field.key)]: field.value,
      }),
      {}
    );

    accumulator.push(fields);
    return accumulator;
  }, []);
}

export function filterByIsoCode(
  data: any[],
  localization: { isoCode: string }
) {
    data = formatData(data, 'array')
    return data.filter((item) => {
        return Object.keys(item).some((key) => item[key] === localization.isoCode);
    });
}

function toCamelCase(string: string) {
  return string.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
}
