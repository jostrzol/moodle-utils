#!/bin/sh
set -euo pipefail


# apply terraform files
terraform -chdir=terraform init
terraform -chdir=terraform apply -auto-approve
