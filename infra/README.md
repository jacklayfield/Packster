# GCP infrastructure

This Terraform/OpenTofu configuration provisions Artifact Registry, Secret Manager secret containers, and optionally two public Cloud Run services. PostgreSQL remains external: a continuously running Cloud SQL instance is not compatible with the project's $5/month target. No VPC, load balancer, Cloud DNS zone, or Cloud Storage bucket is created.

## Prerequisites

- An existing Google Cloud project with billing enabled.
- `gcloud` and either Terraform or OpenTofu installed.
- Permissions to enable project services and create Artifact Registry repositories.
- A PostgreSQL database reachable from the public internet with TLS enabled. This will be a free-tier external provider; Cloud SQL is not created here.
- Google OAuth client credentials if you want account sign-in.
- Application Default Credentials for the account that will run Terraform/OpenTofu.

Authenticate locally and prepare the variables:

```powershell
gcloud auth application-default login
Copy-Item terraform.tfvars.example terraform.tfvars
```

Set `project_id` in `terraform.tfvars` to your project ID. The project is not created by this configuration. `terraform.tfvars` is ignored by git.

## Bootstrap

From this directory, create the repository and secret containers first:

```powershell
tofu init
tofu plan
tofu apply
```

Use `terraform` instead of `tofu` if using Terraform. Review the plan before applying. Secret values are intentionally not stored in Terraform state. After bootstrap, add the database URL and OAuth credentials as secret versions:

```powershell
gcloud secrets versions add packster-database-url --data-file=database-url.txt
gcloud secrets versions add packster-google-client-id --data-file=google-client-id.txt
gcloud secrets versions add packster-google-client-secret --data-file=google-client-secret.txt
```

The files should contain only the corresponding value. Keep them out of source control and delete them after adding the versions. Secret IDs use `resource_prefix` if you changed its default. Set the Google OAuth authorized redirect URI to the backend URL plus `/api/auth/google/callback` after the backend URL is available.

## Build and deploy

Build from the repository root so each Dockerfile can copy its service source. Authenticate Docker for the registry's region (replace the region if you changed the default):

```powershell
gcloud auth configure-docker us-central1-docker.pkg.dev
```

1. Build and push the backend image:

   ```powershell
   $repo = tofu -chdir=infra output -raw image_repository
   docker build -f go-backend/Dockerfile -t "${repo}/backend:v1" .
   docker push "${repo}/backend:v1"
   ```

2. Set `deploy_backend = true` and `backend_image = "<repository>/backend:v1"` in `terraform.tfvars`, then run `tofu apply`. The first deployment uses the placeholder frontend origin; Google sign-in remains disabled until its callback URL is set. Read the backend URL with `tofu output -raw backend_url`.

3. Build and push the frontend image using the backend URL from the previous step:

   ```powershell
   $backendUrl = tofu -chdir=infra output -raw backend_url
   docker build -f frontend/Dockerfile --build-arg "NEXT_PUBLIC_API_URL=$backendUrl" -t "${repo}/frontend:v1" .
   docker push "${repo}/frontend:v1"
   ```

4. Set `deploy_frontend = true` and `frontend_image = "<repository>/frontend:v1"` in `terraform.tfvars`, then run `tofu apply`. Read the frontend URL with `tofu output -raw frontend_url`.

5. Set `frontend_origin` to that exact HTTPS frontend URL and `google_redirect_url` to `<backend URL>/api/auth/google/callback` in `terraform.tfvars`. Add the same redirect URL in Google OAuth settings, then run `tofu apply` again.

Use a new image tag for every rebuild and update the matching image variable in `terraform.tfvars`; Terraform will not roll out an image if the tag string stays unchanged. When the backend URL changes, rebuild the frontend with its new `NEXT_PUBLIC_API_URL`. Keep backend and frontend at one maximum instance each: the Go WebSocket hub currently stores room presence in memory and does not coordinate across instances.

## Cost notes

Cloud Run's free allowance can keep very-low-traffic services inexpensive, but it does not guarantee a $5 maximum. WebSocket connections remain open requests and consume service resources. Artifact Registry storage, Secret Manager active secret versions, network egress, and the external database provider may also incur charges. Set a billing budget/alert and check actual usage; alerts do not cap spending. The configuration deliberately avoids always-on compute, Cloud SQL, load balancing, Cloud NAT, and other networking resources with ongoing charges.
