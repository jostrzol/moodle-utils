output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "kubernetes_cluster_name" {
  value = azurerm_kubernetes_cluster.k8s_cluster.name
}

output "tenant_id" {
  value = azurerm_key_vault.key_vault.tenant_id
}
