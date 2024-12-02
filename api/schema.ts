export type DatePair = {
  started?: string | undefined;
  finished?: string | undefined;
};

export type AttrValue = {
  Text: string;
  TextCollection: string[];
  Date: string;
  DateCollection: string[];
  Number: number;
  DatesPairCollection: DatePair[];
  Image: string;
};

export const AttrValueKeys: (keyof AttrValue)[] = [
  'Text',
  'TextCollection',
  'Number',
  'Date',
  'DateCollection',
  'DatesPairCollection',
  'Image',
];

export type ShemaItemValue = {
  [K in keyof AttrValue]: {
    type: K;
    settings: SchemaSettingsType<K>;
  };
}[keyof AttrValue];
type SchemaSettingsType<K extends keyof AttrValue> = K extends 'Text'
  ? SchemaTextSettings
  : K extends 'Number'
    ? SchemaNumberSettings
    : K extends 'TextCollection'
      ? SchemaTextCollectionSettings
      : K extends 'Date'
        ? SchemaDateSettings
        : K extends 'DateCollection'
          ? SchemaDateCollectionSettings
          : K extends 'DatesPairCollection'
            ? SchemaDatesPairCollectionSettings
            : K extends 'Image'
              ? SchemaImageSettings
              : never;

export type SchemaTextSettings = {
  font?: 'Serif' | 'Sans';
  weight?: 'Light' | 'Normal' | 'Bold' | 'Black';
  theme?: 'Hidden' | 'Default';
  isMultiline?: boolean;
  size?: InputSize;
  displayName?: string;
};

export type InputSize = 'S' | 'M' | 'L';

export type SchemaNumberSettings = {
  min?: number;
  max?: number;
  style?: 'Default' | 'Stars' | 'Slider';
  size?: InputSize;
  decimalPlaces?: number;
  displayName?: string;
};

export type SchemaTextCollectionSettings = {};
export type SchemaDateSettings = {};
export type SchemaDateCollectionSettings = {};
export type SchemaDatesPairCollectionSettings = {};
export type SchemaImageSettings = {};
export type SchemaItem = {
  name: string;
  value: ShemaItemValue;
};

export type Schema = {
  items: SchemaItem[];
  internal_name: string;
  name: string;
  internal_path: string;
  version: string;
  icon?: string;
};

export interface IBookFromDb {
  path: string;
  modified: string;
  markdown: string;

  attrs: Record<string, any>;
}
