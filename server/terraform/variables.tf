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

variable "cluster_name" {
  default = "k8s-mu"
}

variable "dns_prefix" {
  default = "mu-dns"
}

variable "agent_count" {
  default     = 1
  description = "The amount of VMs that will be used for the creation of the cluster."
}

variable "k8s_vm_size" {
  default     = "Standard_D2s_v3"
  description = "The size of the VMs that will be used for the cluster."
}

variable "cert_cert_path" {
  default     = "cert/cert.pem"
  description = "Path to certificate used by the server"
}

variable "cert_key_path" {
  default     = "cert/privkey.pem"
  description = "Path to key used with the certificate by the server"
}
