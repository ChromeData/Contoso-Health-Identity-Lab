# tflint settings: the Terraform rules that come with tflint, recommended set.
# Run: tflint --recursive --config "$PWD/.tflint.hcl"   (in lab/terraform)
plugin "terraform" {
  enabled = true
  preset  = "recommended"
}
