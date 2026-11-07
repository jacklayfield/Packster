output "image_repository" {
  description = "Docker repository path for tagging Packster images."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.containers.repository_id}"
}

output "backend_url" {
  description = "Cloud Run URL for the backend, if deployed."
  value       = try(google_cloud_run_v2_service.backend[0].uri, null)
}

output "frontend_url" {
  description = "Cloud Run URL for the frontend, if deployed."
  value       = try(google_cloud_run_v2_service.frontend[0].uri, null)
}

output "database_secret_name" {
  description = "Secret Manager secret to use for DATABASE_URL."
  value       = google_secret_manager_secret.database_url.secret_id
}

output "google_client_id_secret_name" {
  description = "Secret Manager secret to use for GOOGLE_CLIENT_ID."
  value       = google_secret_manager_secret.google_client_id.secret_id
}

output "google_client_secret_name" {
  description = "Secret Manager secret to use for GOOGLE_CLIENT_SECRET."
  value       = google_secret_manager_secret.google_client_secret.secret_id
}
