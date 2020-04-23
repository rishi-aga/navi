declare module 'ember-get-config' {
  type DataSourceType = 'bard-facts';
  interface DataSource {
    name: string;
    uri: string;
    type: DataSourceType;
  }
  interface AddonOptions {
    dataSources: DataSource[];
    defaultDataSource?: string;
    searchThresholds?: {
      contains?: number;
      in?: number;
    };
  }
  interface EmberConfig {
    navi: AddonOptions;
  }

  const value: EmberConfig;
  export default value;
}
