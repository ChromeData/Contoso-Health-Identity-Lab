variable "subscription_id" {
  description = "Azure subscription id. Empty = take it from the ARM_SUBSCRIPTION_ID environment variable."
  type        = string
  default     = ""
}

variable "resource_group_name" {
  description = "An existing resource group."
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "Resource id of an existing Log Analytics workspace. The audit logs go there."
  type        = string
}

variable "storage_account_name" {
  description = "A globally unique name for the storage account (3 to 24 lowercase letters and digits)."
  type        = string
  default     = "stexampleevidence01"
}

variable "immutability_period_days" {
  description = "How many days a blob version cannot change or be deleted."
  type        = number
  default     = 30
}
