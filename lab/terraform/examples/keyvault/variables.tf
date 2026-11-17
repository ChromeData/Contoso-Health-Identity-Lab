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

variable "key_vault_name" {
  description = "A globally unique name for the vault (3 to 24 characters)."
  type        = string
  default     = "kv-example-0001"
}
