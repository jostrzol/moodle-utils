#!/bin/sh
set -euo pipefail

### CONFIG ###
# the namespace used
k8s_namespace="moodle-utils-ns"
#############

# apply terraform files
terraform -chdir=terraform init
terraform -chdir=terraform apply -auto-approve

# save tf values for use with k8s
cluster_name=$(terraform -chdir=terraform output -raw kubernetes_cluster_name)
cluster_rg_name=$(terraform -chdir=terraform output -raw resource_group_name)
tenant_id=$(terraform -chdir=terraform output -raw tenant_id)

# switch to new k8s context
az aks get-credentials --name $cluster_name --resource-group $cluster_rg_name

# create new namespace
kubectl apply -f ./k8s/01-namespace.yaml

# apply the rest of k8s config files
kubectl apply -f ./k8s/ --overwrite=true -n $k8s_namespace
