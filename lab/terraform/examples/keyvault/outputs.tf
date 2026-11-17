output "key_vault_name" {
  description = "The name of the vault."
  value       = module.keyvault.key_vault_name
}

output "key_vault_uri" {
  description = "The address of the vault."
  value       = module.keyvault.key_vault_uri
}
