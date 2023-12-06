# The following variable declaration is a placeholder references.
# Set the value as a tf apply flag or in terraform.tfvars
variable "azure_subscription_id" {
  default = ""
}

variable "resource_group_name_prefix" {
  default     = "rg"
  description = "Prefix of the resource group name that's combined with a random ID so the name is unique."
}

variable "resource_group_location" {
  default     = "germanywestcentral"
  description = "Location of the resource group."
}

