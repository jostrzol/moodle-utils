# resource group name
resource "random_pet" "rg_name" {
  prefix = var.resource_group_name_prefix
}

resource "azurerm_resource_group" "rg" {
  location = var.resource_group_location
  name     = random_pet.rg_name.id
}

resource "azurerm_kubernetes_cluster" "k8s_cluster" {
  name                = var.cluster_name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = var.dns_prefix

  default_node_pool {
    name       = "agentpool"
    type       = "VirtualMachineScaleSets"
    node_count = var.agent_count
    vm_size    = var.k8s_vm_size

  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = "Production"
  }
}

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "key_vault" {
  name                       = "keyvault-mu"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7

  access_policy {
      tenant_id = data.azurerm_client_config.current.tenant_id
      object_id = data.azurerm_client_config.current.object_id

      key_permissions = [
        "Create",
        "Get",
        "Import",
        "List",
        "Update"
      ]

      secret_permissions = [
        "Set",
        "Get",
        "Delete",
        "List",
        "Purge",
        "Recover"
      ]
    }

}

resource "azurerm_key_vault_access_policy" "kubelet" {
  key_vault_id = azurerm_key_vault.key_vault.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id = azurerm_kubernetes_cluster.k8s_cluster.kubelet_identity[0].object_id

  key_permissions = [
    "Get",
  ]

  secret_permissions = [
    "Get",
  ]
}
