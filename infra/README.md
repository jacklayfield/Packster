# GCP infrastructure

This is a small Terraform/OpenTofu-compatible starting point for GCP. It enables the Artifact Registry and Cloud Run APIs and creates a Docker Artifact Registry repository. It deliberately does not create Cloud Run services, a database, or secrets yet; the app does not have container build definitions, and those resources introduce deployment and cost choices.

## Prerequisites

- An existing Google Cloud project with billing enabled.
- `gcloud` and either Terraform or OpenTofu installed.
- Permissions to enable project services and create Artifact Registry repositories.
- Application Default Credentials for the account that will run Terraform/OpenTofu.

Authenticate locally and prepare the variables:

```powershell
gcloud auth application-default login
Copy-Item terraform.tfvars.example terraform.tfvars
```

Set `project_id` in `terraform.tfvars` to your project ID. The project is not created by this configuration. `terraform.tfvars` is ignored by git.

## Preview and apply

Run these commands from this directory:

```powershell
tofu init
tofu plan
tofu apply
```

Use `terraform` instead of `tofu` if using Terraform. Review the plan before applying. Creating the repository may incur Artifact Registry storage charges; destroying this configuration leaves the enabled APIs enabled.

After apply, the `image_repository` output is the registry path to use when tagging images. Cloud Run services, application containers, PostgreSQL, and runtime secrets are intentionally left for a later deployment step.
