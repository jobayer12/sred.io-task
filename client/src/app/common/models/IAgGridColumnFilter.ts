export type FilterType = 'number' | 'date' | 'text';

export type TypeText = 'contains' | 'equals' | 'startsWith' | 'endsWith';
export type TypeDate = "lessThan" | "equals" | "greaterThan" | "inRange";
export type TypeNumber = "equals" | "greaterThan" | "lessThan" | "inRange";


export interface BaseFilter {
    filter: string | number;
    filterType: FilterType;
    type: TypeText | string;
}

export interface NumberFilter extends BaseFilter {
    type: Exclude<TypeNumber, 'inRange'>;
}

export interface NumberRangeFilter extends BaseFilter {
    type: 'inRange',
    filterTo: string;
}

// Filter when type is "date" and filterType is "inRange"
export interface DateRangeFilter extends BaseFilter {
    filterType: 'date';
    type: TypeDate;
    dateFrom: string; // Replaces `filter` with `dateFrom`
    dateTo: string | null;   // Adds `dateTo` for "date" + "inRange"
}

// Union type for all conditions
export type ConditionalGridColumnFilter = NumberRangeFilter | NumberFilter | NumberRangeFilter | DateRangeFilter;


export interface ColumnHttpFilterParams {
    filterType: FilterType;
    value: string | number | [string, string] | [number, number];
    type: TypeText | TypeDate | TypeNumber;
    key: string;
} 

export type ColumnFilter = {
    [key: string]: ConditionalGridColumnFilter
  }