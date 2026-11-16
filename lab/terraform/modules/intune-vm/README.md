# modules/intune-vm: The managed Windows 11 VM

This module makes one Windows 11 Enterprise virtual machine. It is Entra joined and enrolled in Intune.
It is the compliant device for policy CA005. It has no public IP address and no inbound rule.

## Usage

The lab calls this module in [`envs/dev/main.tf`](../../envs/dev/main.tf):

```hcl
module "intune_vm" {
  source = "../../modules/intune-vm"
  count  = var.enable_intune_vm ? 1 : 0

  resource_group_name = azurerm_resource_group.idlab.name
  location            = var.location
  vnet_name           = module.keyvault.vnet_name
  vm_size             = var.intune_vm_size
  attach_nat_gateway          = var.enable_dc
  nat_gateway_id              = var.enable_dc ? one(module.dc_vm[*].nat_gateway_id) : null
  admin_login_user_object_ids = var.intune_vm_admin_login_object_ids

  admin_login_group_object_ids = var.enable_premium ? { ca005_pilot = module.groups[0].ca005_pilot_group_object_id } : {}

  tags = var.tags
}
```

## Tests

2 test files in [`tests/`](tests/), with mocked providers. No sign-in is necessary.

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
| [azurerm_dev_test_global_vm_shutdown_schedule.vm](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/dev_test_global_vm_shutdown_schedule) | resource |
| [azurerm_network_interface.vm](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/network_interface) | resource |
| [azurerm_network_security_group.endpoints](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/network_security_group) | resource |
| [azurerm_role_assignment.vm_admin_login_group](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_role_assignment.vm_admin_login_user](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_subnet.endpoints](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/subnet) | resource |
| [azurerm_subnet_nat_gateway_association.endpoints](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/subnet_nat_gateway_association) | resource |
| [azurerm_subnet_network_security_group_association.endpoints](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/subnet_network_security_group_association) | resource |
| [azurerm_virtual_machine_extension.aad_login](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/virtual_machine_extension) | resource |
| [azurerm_windows_virtual_machine.vm](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/windows_virtual_machine) | resource |
| [random_password.admin](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| resource\_group\_name | Resource group for the VM and its network resources (contract: rg-identity-lab). | `string` | n/a | yes |
| vnet\_name | Existing lab VNet (created by modules/keyvault) the endpoint subnet joins. | `string` | n/a | yes |
| admin\_login\_group\_object\_ids | Entra GROUP object ids granted "Virtual Machine Administrator Login" on this<br/>VM, keyed by a STATIC label (e.g. { ca005\_pilot = <group id> }). A map so<br/>the for\_each keys are known at plan time even when the group is created in<br/>the same apply (values may be unknown; keys may not). | `map(string)` | `{}` | no |
| admin\_login\_user\_object\_ids | Entra USER object ids granted "Virtual Machine Administrator Login" on this<br/>VM (Entra RDP sign-in as local admin). Typically your own admin account.<br/>Owner/Contributor alone do NOT allow sign-in - this role is required. | `list(string)` | `[]` | no |
| admin\_username | LOCAL admin (break-glass into the VM only - day-to-day sign-in is Entra).<br/>It is not an Entra identity and plays no part in the join: the<br/>AADLoginForWindows extension joins the VM using its system-assigned<br/>identity. Entra users get admin rights only through the "Virtual Machine<br/>Administrator Login" role - Microsoft documents that adding AzureAD\<upn><br/>to the local Administrators group by hand is NOT supported. | `string` | `"contosolocal"` | no |
| attach\_nat\_gateway | Attach the endpoint subnet to nat\_gateway\_id for explicit outbound (the PC has no public IP since 2026-11-08). A bool, so count is known at plan. | `bool` | `false` | no |
| auto\_shutdown\_time | Daily deallocate time, HHmm (24h). | `string` | `"1900"` | no |
| auto\_shutdown\_timezone | Windows time zone id for the shutdown schedule. | `string` | `"Eastern Standard Time"` | no |
| computer\_name | Windows hostname = the Entra DEVICE name the AADLoginForWindows extension<br/>registers. Entra RDP (enablerdsaadauth) only works when the name you<br/>connect to matches it, and a re-deploy fails to join if a stale device<br/>with the same name still exists in Entra (delete it first - see main.tf). | `string` | `"CH-WIN11-01"` | no |
| enable\_intune\_enrollment | true (default) = pass mdmId (the Microsoft Intune MDM application id) to<br/>the AADLoginForWindows extension so the Entra join also auto-enrolls the<br/>VM into Intune. false = Entra join only (no compliance demo).<br/>Requires the human steps "MDM user scope" + licence in Intune BEFORE the<br/>VM is created: enrollment is attempted during the join, when the<br/>extension installs (see main.tf header). | `bool` | `true` | no |
| image\_sku | Windows 11 Enterprise (single-session) marketplace SKU under publisher<br/>MicrosoftWindowsDesktop, offer windows-11. Default win11-25h2-ent (build<br/>26200.x). Microsoft's Azure Local "Azure Marketplace images" table lists<br/>publisher microsoftwindowsdesktop / offer windows-11 / SKUs<br/>win11-23h2-ent, win11-24h2-ent, win11-25h2-ent. The Entra-login extension<br/>requires Windows 11 24H2 or later (Microsoft Learn, "Sign in to a Windows<br/>VM in Azure by using Microsoft Entra ID"), so 24h2/25h2 are the sensible<br/>values. Marketplace availability is per region - confirm before apply:<br/>  az vm image list-skus -l eastus2 -p MicrosoftWindowsDesktop -f windows-11 -o tsv --query "[].name" \| grep ent | `string` | `"win11-25h2-ent"` | no |
| location | Azure region (contract: eastus2). | `string` | `"eastus2"` | no |
| nat\_gateway\_id | NAT gateway for the endpoint subnet (DC01's, from modules/dc-vm). Used only when attach\_nat\_gateway is true. | `string` | `null` | no |
| subnet\_name | Name of the endpoint subnet this module creates in the lab VNet. | `string` | `"snet-endpoints"` | no |
| subnet\_prefix | CIDR for the endpoint subnet. Lab VNet plan: 10.42.1.0/24 private<br/>endpoints (keyvault), 10.42.2.0/24 snet-identity (dc-vm), 10.42.3.0/24<br/>endpoints (this module). | `list(string)` | <pre>[<br/>  "10.42.3.0/24"<br/>]</pre> | no |
| tags | Tags applied to every resource in this module. | `map(string)` | `{}` | no |
| vm\_name | Azure resource name of the VM. | `string` | `"vm-win11-01"` | no |
| vm\_size | VM size. Standard\_B2s (2 vCPU / 4 GiB) is the smallest size that meets the<br/>Windows 11 minimum (2 cores, 4 GB RAM) and supports Trusted Launch. It is<br/>sluggish but fine for an enroll-and-show demo; Standard\_B2as\_v2 /<br/>Standard\_B2s\_v2 (8 GiB) is the smoother drop-in if v1 B-series is<br/>unavailable in your region. | `string` | `"Standard_B2s"` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| admin\_password | Local break-glass admin password (state only). Use only if Entra sign-in fails. |
| admin\_username | Local break-glass admin user name (day-to-day sign-in is Entra). |
| computer\_name | Windows hostname = Entra device name (search for it in Entra Devices and Intune). |
| identity\_principal\_id | Object id of the VM's system-assigned identity (used by AADLoginForWindows for the Entra join). |
| intune\_enrollment\_enabled | Whether the Entra-login extension was given the Intune mdmId (auto-enrollment). |
| private\_ip | Private IP in snet-endpoints. |
| public\_ip | Always null since 2026-11-08: the PC has no public IP; admins use Azure Bastion. |
| rdp\_file\_content | Minimal .rdp for Entra sign-in (enablerdsaadauth). full address is the<br/>HOSTNAME on purpose - Entra RDP rejects IP addresses. Since 2026-11-08 the<br/>PC has no public IP: this file is for a client with a private path to it<br/>(people use Azure Bastion). Save with:<br/>terraform output -raw intune\_vm\_rdp\_file > ch-win11-01.rdp |
| vm\_id | Resource id of the Windows 11 VM. |
| vm\_name | Azure name of the VM (az vm start / deallocate / run-command). |
<!-- END_TF_DOCS -->
