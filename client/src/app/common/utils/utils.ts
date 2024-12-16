import { ColDef, ColGroupDef } from "ag-grid-community";
import { ColumnFilter, ColumnHttpFilterParams, ConditionalGridColumnFilter } from "../models/IAgGridColumnFilter";

export const isValidDate = (value: any): boolean => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
export const GenerateColDef = (data: any): Array<ColDef | ColGroupDef> => {
  const colDefs: any[] = [];

  const processKey = (key: string, value: any, parentKey: string = '') => {
    const fullKey = parentKey ? `${parentKey}__${key}` : key;

    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      // Create a group header for nested objects
      const groupColDef: ColGroupDef = {
        headerName: capitalizeFirstLetter(key),
        children: [],
      };

      Object.keys(value).forEach((nestedKey) => {
        // Push children into the groupColDef's children array
        const childColDefs = processKey(nestedKey, value[nestedKey], fullKey);
        groupColDef.children!.push(...(Array.isArray(childColDefs) ? childColDefs : [childColDefs]));
      });

      return groupColDef; // Return the group column definition
    } else {

      
      let filterType: string = 'text'; // Default to text filter

      // Infer filter type based on value type
      if (typeof value === 'number') {
        filterType = 'agNumberColumnFilter';
      } else if (isValidDate(value)) {
        filterType = 'agDateColumnFilter';
      } else {
        filterType = 'agTextColumnFilter';
      }

      // Create a regular column for primitive values
      return {
        field: fullKey,
        colId: fullKey,
        filter: filterType,
        headerName: capitalizeFirstLetter(key),
        filterParams: getAdvancedFilterParams(fullKey, filterType),
      } as ColDef;
    }
  };

  Object.keys(data).forEach((key) => {
    const colDef = processKey(key, data[key]);
    if (Array.isArray(colDef)) {
      colDefs.push(...colDef);
    } else {
      colDefs.push(colDef);
    }
  });
  return colDefs;
}

export const capitalizeFirstLetter = (str: string): string => {
  str = str.replace('__', ' ').trim();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const getAdvancedFilterParams =(fullKey: string, filterType: string): any => {
  let filterOptions: string[] = ['contains', 'equals', 'startsWith', 'endsWith'];

  if (['_id', 'integrationId', 'repositoryId', 'organizationId'].includes(fullKey)) filterOptions = ['equals'];

  if (filterType === 'agNumberColumnFilter') {
    filterOptions = ["equals", "greaterThan", "lessThan", "inRange"];
  } else if (filterType === 'agDateColumnFilter') {
    filterOptions = ["lessThan", "equals", "greaterThan", "inRange"];
  }
  return {
    buttons: ['apply', 'reset'],
    filterOptions,
    maxNumConditions: 1
  };
}

export const FlattenRowData = (data: any, parentKey: string = '', result: any = {}): any => {
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const fullKey = parentKey ? `${parentKey}__${key}` : key;

      if (typeof data[key] === 'object' && !Array.isArray(data[key]) && data[key] !== null) {
        // Recursively flatten nested objects
        FlattenRowData(data[key], fullKey, result);
      } else {
        // Assign primitive values directly
        result[fullKey] = data[key];
      }
    }
  }
  return result;
}

export  const ProcessColumnFilter = (filter: ColumnFilter | null): Array<ColumnHttpFilterParams> => {
  if (!filter || Object.keys(filter).length === 0) return [];
  return Object.keys(filter).map((key: string) => {
    const gridFilter: ConditionalGridColumnFilter = filter[key];
    let formatPayload!: ColumnHttpFilterParams;
    const formattedKey = key.replaceAll('__', '.');
    if (gridFilter.filterType === 'date') {
      if (gridFilter.type === 'inRange' && 'dateFrom' in gridFilter && 'dateTo' in gridFilter && gridFilter.dateTo) {
        formatPayload = {
          filterType: 'date',
          value: [gridFilter.dateFrom, gridFilter.dateTo],
          type: gridFilter.type,
          key: formattedKey
        };
      } else if ('dateFrom' in gridFilter) {
        formatPayload = {
          filterType: 'date',
          value: gridFilter.dateFrom,
          type: gridFilter.type,
          key: formattedKey
        };
      }
    } else if (gridFilter.filterType === 'number') {
      if (gridFilter.type === 'inRange' && 'filterTo' in gridFilter && 'filter' in gridFilter) {
        formatPayload = {
          filterType: 'number',
          value: [+gridFilter.filter, +gridFilter.filterTo],
          type: gridFilter.type,
          key: formattedKey
        };
      } else {
        formatPayload = {
          filterType: 'number',
          value: gridFilter.filter,
          type: gridFilter.type,
          key: formattedKey
        };
      }
    } else {
      formatPayload = {
        filterType: 'text',
        value: gridFilter.filter,
        type: gridFilter.type,
        key: formattedKey
      };
    }
    return formatPayload;
  });
}