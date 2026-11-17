# The example plans with mocked providers. No sign-in is necessary.
#   terraform init -backend=false && terraform test

mock_provider "azuread" {}
mock_provider "random" {}

variables {
  break_glass_domain = "example.onmicrosoft.com"
}

run "the_example_plans" {
  command = plan

  assert {
    condition     = length(module.groups.break_glass_user_principal_names) == 2
    error_message = "The example must plan two break-glass accounts."
  }
}
