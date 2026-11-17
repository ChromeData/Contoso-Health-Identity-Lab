# Example: the groups and the two break-glass accounts of the lab, in an Entra
# tenant. Use a test tenant: this makes two Global Administrator accounts.

provider "azuread" {}

module "groups" {
  source = "../../modules/groups"

  break_glass_domain = var.break_glass_domain
}
