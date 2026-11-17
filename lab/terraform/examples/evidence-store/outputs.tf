output "storage_account_name" {
  description = "The name of the evidence store."
  value       = module.evidence_store.storage_account_name
}

output "immutability" {
  description = "The immutability policy of the store: its state and its number of days."
  value       = module.evidence_store.immutability
}
