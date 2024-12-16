export const isValidDate = (value: any): boolean => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }