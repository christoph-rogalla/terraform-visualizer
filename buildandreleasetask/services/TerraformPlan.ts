export interface TerraformPlan {
  format_version: string;
  terraform_version: string;
  variables: any;
  planned_values: any;
  resource_drift: any;
  resource_changes: ResourceChanges[];
}

export interface ResourceChanges {
  address: string;
  mode: string;
  type: string;
  name: string;
  provider_name: string;
  change: ResourceChange;
}

export interface ResourceChange {
  actions: ActionType[];
  before: any;
  after: any;
}

export enum ActionType {
  CREATE = "create",
  UPDATE = "update",
  READ = "read",
  DELETE = "delete",
  REPLACE = "replace",
  NONE = "no-op"
}