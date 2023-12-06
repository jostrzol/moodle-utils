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
