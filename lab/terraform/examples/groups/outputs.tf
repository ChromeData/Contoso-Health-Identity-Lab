output "break_glass_group_object_id" {
  description = "The object id of the Break-Glass-Admins group. Each Conditional Access policy excludes it."
  value       = module.groups.break_glass_group_object_id
}

output "all_nurses_group_object_id" {
  description = "The object id of the dynamic All-Nurses group."
  value       = module.groups.all_nurses_group_object_id
}
