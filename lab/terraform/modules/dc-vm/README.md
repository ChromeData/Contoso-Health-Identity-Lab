# modules/dc-vm: The domain controller VM

This module makes one Windows Server virtual machine. It becomes the AD DS domain controller (with AD CS) for the lab domain.
By default it has no public IP address and no inbound rule from the internet. Outbound traffic goes through a NAT gateway.
A person gets to it through Azure Bastion. Scripts use `az vm run-command`. See [ADR 0013](../../../docs/adr/0013-tier0-domain-controller-exposure.md).

## Usage

The lab calls this module in [`envs/dev/main.tf`](../../envs/dev/main.tf):

```hcl
module "dc_vm" {
  source = "../../modules/dc-vm"
  count  = var.enable_dc ? 1 : 0

  resource_group_name = azurerm_resource_group.idlab.name
  location            = var.location
  vnet_name           = module.keyvault.vnet_name
  key_vault_id        = module.keyvault.key_vault_id
  allowed_ip_ranges   = var.operator_ip_ranges
  vm_size             = var.dc_vm_size
  adfs_https_enabled = var.enable_adfs_https
  tags               = var.tags
}
```

## Tests

1 test file in [`tests/`](tests/), with mocked providers. No sign-in is necessary.

```
terraform init -backend=false
terraform test
```

## More detail

The header of [`main.tf`](main.tf) gives the design, the limits and the license notes.
The lists below are made by `terraform-docs`. Do not edit them by hand. Run [`tools/module-docs.sh`](../../tools/module-docs.sh).

<!-- BEGIN_TF_DOCS -->
### Requirements

| Name | Version |
| ---- | ------- |
| terraform | >= 1.6.0 |
| azurerm | ~> 4.0 |
| random | ~> 3.6 |

### Providers

| Name | Version |
| ---- | ------- |
| azurerm | ~> 4.0 |
| random | ~> 3.6 |

### Resources

| Name | Type |
| ---- | ---- |
| [azurerm_dev_test_global_vm_shutdown_schedule.dc](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/dev_test_global_vm_shutdown_schedule) | resource |
| [azurerm_managed_disk.ntds](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/managed_disk) | resource |
| [azurerm_monitor_activity_log_alert.dc_run_command](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/monitor_activity_log_alert) | resource |
| [azurerm_nat_gateway.dc](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/nat_gateway) | resource |
| [azurerm_nat_gateway_public_ip_association.dc](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/nat_gateway_public_ip_association) | resource |
| [azurerm_network_interface.dc](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/network_interface) | resource |
| [azurerm_network_security_group.dc](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/network_security_group) | resource |
| [azurerm_public_ip.adfs_https](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/public_ip) | resource |
| [azurerm_public_ip.nat](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/public_ip) | resource |
| [azurerm_role_assignment.dc_kv_secrets_officer](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_subnet.dc](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/subnet) | resource |
| [azurerm_subnet_nat_gateway_association.dc](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/subnet_nat_gateway_association) | resource |
| [azurerm_subnet_network_security_group_association.dc](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/subnet_network_security_group_association) | resource |
| [azurerm_virtual_machine_data_disk_attachment.ntds](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/virtual_machine_data_disk_attachment) | resource |
| [azurerm_windows_virtual_machine.dc](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/windows_virtual_machine) | resource |
| [random_password.admin](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| key\_vault\_id | Key Vault the DC's identity may write its build secrets to (dc01-dsrm-password, svc-vault-rotator; and svc-pam-discovery, retired but still named because the vault lock blocks the replace; ABAC-limited to those names in main.tf). | `string` | n/a | yes |
| resource\_group\_name | Resource group for the DC and its network resources. | `string` | n/a | yes |
| vnet\_name | Existing lab VNet (created by modules/keyvault) the DC subnet joins. | `string` | n/a | yes |
| adfs\_https\_enabled | Also admit HTTPS (443) to the DC from allowed\_ip\_ranges, for the<br/>TEMPORARY AD FS migration exercise (lab/adfs/README.md): the operator's<br/>test browser signs in to AD FS on DC01 through it. AD FS is Tier 0 like<br/>the DC, and the allowlist is the same single /32. Off by default; turn it<br/>off when 19-Remove-Adfs.ps1 has run. | `bool` | `false` | no |
| admin\_username | Local admin (becomes the domain's built-in Administrator account name after promotion). | `string` | `"contosoadmin"` | no |
| allowed\_ip\_ranges | Operator egress IPs admitted to HTTPS (443) on the DC during the AD FS<br/>exercise ONLY (adfs\_https\_enabled). Each a single IPv4 host written as a<br/>/32, e.g. "203.0.113.7/32". RDP and LDAPS are never opened to the<br/>internet, whatever this holds (R5, ADR 0013 amendment 2026-11-08).<br/>Nothing wider than one address is accepted: a /24 mistyped or kept "for<br/>convenience" would open a Tier-0 listener to 256 addresses (risk<br/>register R13). | `list(string)` | `[]` | no |
| auto\_shutdown\_time | Daily deallocate time, HHmm (24h). | `string` | `"1900"` | no |
| auto\_shutdown\_timezone | Windows time zone id for the shutdown schedule. | `string` | `"Eastern Standard Time"` | no |
| computer\_name | Windows hostname (max 15 chars). | `string` | `"DC01"` | no |
| location | Azure region (contract: eastus2). | `string` | `"eastus2"` | no |
| nat\_gateway\_enabled | Give snet-identity a NAT gateway for the DC's outbound traffic (Entra<br/>provisioning agent, Windows Update, activation, Defender for Identity).<br/>The DC has no public IP of its own, so without this it falls back to<br/>Azure's implicit default outbound access, which Microsoft is retiring.<br/>About $1.10/day whether the DC runs or not (main.tf COST). | `bool` | `true` | no |
| ntds\_disk\_size\_gb | Size of the NTDS/SYSVOL data disk. | `number` | `8` | no |
| private\_ip | Static private IP of the DC (first usable host in snet-identity). | `string` | `"10.42.2.4"` | no |
| run\_command\_alert\_action\_group\_ids | Action groups the Run Command alert notifies. Empty = the alert shows in Azure Monitor only. | `list(string)` | `[]` | no |
| run\_command\_alert\_enabled | Activity log alert on every Run Command against the DC (Tier-0 action, R5). Free. | `bool` | `true` | no |
| subnet\_prefix | CIDR for snet-identity. | `list(string)` | <pre>[<br/>  "10.42.2.0/24"<br/>]</pre> | no |
| tags | Tags applied to every resource in this module. | `map(string)` | `{}` | no |
| vm\_name | Azure resource name of the VM. | `string` | `"vm-dc01"` | no |
| vm\_size | VM size. B2s (2 vCPU / 4 GiB) runs AD DS + AD CS + the Entra provisioning<br/>agent for a lab. If B-series v1 is unavailable in your region/subscription,<br/>Standard\_B2s\_v2 is the drop-in. | `string` | `"Standard_B2s"` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| admin\_password | Initial local admin password (state only). Rotate after first sign-in and keep the new one in Key Vault. |
| admin\_username | Initial local admin user name. |
| identity\_principal\_id | Object id of the DC's system-assigned identity (Key Vault Secrets Officer, ABAC-limited to its three build secrets). |
| nat\_gateway\_id | The DC subnet's NAT gateway id (null when nat\_gateway\_enabled is false). envs/dev also attaches the Intune PC's subnet to it. |
| nat\_gateway\_public\_ip | Outbound-only address the DC's traffic leaves from (NAT gateway). Nothing can connect in through it. |
| private\_ip | Static private IP of the DC (reached from inside the VNet only: Bastion, member servers). |
| public\_ip | The DC's public IP: null except during the AD FS exercise (adfs\_https\_enabled; 443 from allowed\_ip\_ranges only). RDP and LDAPS are never reachable from the internet. |
| vm\_id | Resource id of the DC VM. |
| vm\_name | Azure name of the DC VM (for az vm run-command / start / deallocate). |
<!-- END_TF_DOCS -->
